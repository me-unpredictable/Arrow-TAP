/**
 * @file ropeRenderer.ts
 * @description PixiJS rendering pipeline for slim braided ropes, realistic textures, sharp arrow tips, tactile knots, and true path-following snake slither physics.
 */

import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { GridCoord, Rope, Vector2D } from '../types';

export interface RopeGraphicHandle {
  rope: Rope;
  container: PIXI.Container;
  updateLayout: (cellSize: number, originX: number, originY: number) => void;
  animateSlitherOut: (cellSize: number, originX: number, originY: number, onComplete: () => void) => void;
  animateBlockedShake: (cellSize: number, originX: number, originY: number) => void;
}

/**
 * Converts discrete grid coordinate to canvas pixel position.
 * 
 * @param {GridCoord} coord - Discrete grid position.
 * @param {number} cellSize - Cell dimension.
 * @param {number} originX - Board origin X.
 * @param {number} originY - Board origin Y.
 * @returns {{ x: number; y: number }} Pixel coordinate.
 * @description Maps grid units to board canvas pixels: pixel = origin + (coord + 0.5) * cellSize.
 */
export function gridToPixel(
  coord: GridCoord,
  cellSize: number,
  originX: number,
  originY: number
): { x: number; y: number } {
  return {
    x: originX + (coord.x + 0.5) * cellSize,
    y: originY + (coord.y + 0.5) * cellSize
  };
}

/**
 * Draws a sharp directional arrowhead at the head point of a rope.
 * 
 * @param {PIXI.Graphics} graphics - Target PixiJS graphics context.
 * @param {{ x: number; y: number }} head - Head pixel coordinate.
 * @param {Vector2D} dir - Direction vector.
 * @param {number} size - Arrow size.
 * @param {number} color - Color code.
 * @returns {void}
 * @description Renders a sharp filled arrowhead rotated in the exit direction.
 */
export function drawArrowHead(
  graphics: PIXI.Graphics,
  head: { x: number; y: number },
  dir: Vector2D,
  size: number,
  color: number
): void {
  const angle = Math.atan2(dir.dy, dir.dx);
  const arrowLength = size * 1.5;
  const arrowWidth = size * 1.0;

  // Arrow Tip
  const tipX = head.x + Math.cos(angle) * (size * 0.8);
  const tipY = head.y + Math.sin(angle) * (size * 0.8);

  // Left wing
  const leftX = tipX - Math.cos(angle) * arrowLength + Math.sin(angle) * arrowWidth;
  const leftY = tipY - Math.sin(angle) * arrowLength - Math.cos(angle) * arrowWidth;

  // Right wing
  const rightX = tipX - Math.cos(angle) * arrowLength - Math.sin(angle) * arrowWidth;
  const rightY = tipY - Math.sin(angle) * arrowLength + Math.cos(angle) * arrowWidth;

  graphics.poly([
    { x: tipX, y: tipY },
    { x: leftX, y: leftY },
    { x: tipX - Math.cos(angle) * (arrowLength * 0.6), y: tipY - Math.sin(angle) * (arrowLength * 0.6) },
    { x: rightX, y: rightY }
  ]);
  graphics.fill({ color });
  graphics.stroke({ color: 0x0A0E17, width: 1.5 });
}

/**
 * Renders a polyline path with realistic braided rope twist patterns, borders, arrowheads, and knot dots.
 * 
 * @param {PIXI.Graphics} graphics - Target graphics context.
 * @param {{ x: number; y: number }[]} points - Array of pixel vertices.
 * @param {Vector2D} dir - Exit direction vector.
 * @param {number} color - Primary rope color.
 * @param {number} ropeWidth - Thickness in pixels.
 * @returns {void}
 * @description Draws dark outline, primary core, braided fiber twist dashed highlights, tail knot, and head arrow.
 */
export function drawTexturedRope(
  graphics: PIXI.Graphics,
  points: { x: number; y: number }[],
  dir: Vector2D,
  color: number,
  ropeWidth: number
): void {
  if (points.length < 2) return;

  // 1. Dark Outline Underlay
  graphics.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    graphics.lineTo(points[i].x, points[i].y);
  }
  graphics.stroke({
    color: 0x070B14,
    width: ropeWidth + 3,
    cap: 'round',
    join: 'round'
  });

  // 2. Main Rope Core
  graphics.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    graphics.lineTo(points[i].x, points[i].y);
  }
  graphics.stroke({
    color: color,
    width: ropeWidth,
    cap: 'round',
    join: 'round'
  });

  // 3. Braided Twist / Fiber Highlight
  graphics.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    graphics.lineTo(points[i].x, points[i].y);
  }
  graphics.stroke({
    color: 0xFFFFFF,
    width: Math.max(1, ropeWidth * 0.3),
    alpha: 0.45,
    cap: 'round',
    join: 'round'
  });

  // 4. Tail Knot (First coordinate)
  const tail = points[0];
  graphics.circle(tail.x, tail.y, ropeWidth * 0.85);
  graphics.fill({ color: 0xFFFFFF });
  graphics.circle(tail.x, tail.y, ropeWidth * 0.65);
  graphics.fill({ color: color });
  graphics.circle(tail.x, tail.y, ropeWidth * 0.3);
  graphics.fill({ color: 0x070B14 });

  // 5. Head Arrow (Last coordinate)
  const head = points[points.length - 1];
  drawArrowHead(graphics, head, dir, ropeWidth * 1.5, color);
}

/**
 * Creates the interactive graphic handle for a rope with true snake slither pulling physics.
 * 
 * @param {Rope} rope - The target rope data.
 * @param {(rope: Rope) => void} onKnotTap - Tap callback.
 * @returns {RopeGraphicHandle} Graphic handle for the rope.
 * @description Sets up graphics container, hit areas, braided rendering, and path-following slither animation.
 */
export function createRopeGraphic(
  rope: Rope,
  onKnotTap: (rope: Rope) => void
): RopeGraphicHandle {
  const container = new PIXI.Container();
  const graphics = new PIXI.Graphics();
  container.addChild(graphics);

  container.eventMode = 'static';
  container.cursor = 'pointer';

  /**
   * Re-draws the rope at rest.
   * 
   * @param {number} cellSize - Cell size in pixels.
   * @param {number} originX - Board X.
   * @param {number} originY - Board Y.
   * @returns {void}
   * @description Clears and renders static textured rope path.
   */
  function redraw(cellSize: number, originX: number, originY: number): void {
    graphics.clear();
    const ropeWidth = Math.max(3.5, cellSize * 0.28);
    const points = rope.body.map(pt => gridToPixel(pt, cellSize, originX, originY));
    drawTexturedRope(graphics, points, rope.exitDirection, rope.color, ropeWidth);
  }

  container.on('pointerdown', (e) => {
    e.stopPropagation();
    onKnotTap(rope);
  });

  return {
    rope,
    container,

    updateLayout: (cellSize: number, originX: number, originY: number) => {
      redraw(cellSize, originX, originY);
    },

    /**
     * Animates the rope slithering forward along its exact polyline track like a pulled snake.
     * 
     * @param {number} cellSize - Grid cell size in pixels.
     * @param {number} originX - Board X origin.
     * @param {number} originY - Board Y origin.
     * @param {() => void} onComplete - Completion callback.
     * @returns {void}
     * @description Interpolates the head forward along exit raycast while the tail follows the body path.
     */
    animateSlitherOut: (cellSize: number, originX: number, originY: number, onComplete: () => void) => {
      const originalPoints = rope.body.map(pt => gridToPixel(pt, cellSize, originX, originY));
      const ropeWidth = Math.max(3.5, cellSize * 0.28);
      const totalLength = originalPoints.length;

      // Extend forward track
      const extendedTrack = [...originalPoints];
      const head = originalPoints[originalPoints.length - 1];
      const dir = rope.exitDirection;

      // Add projection steps past the boundary
      for (let step = 1; step <= 25; step++) {
        extendedTrack.push({
          x: head.x + dir.dx * cellSize * step,
          y: head.y + dir.dy * cellSize * step
        });
      }

      const progressObj = { progress: 0 };
      const maxSteps = extendedTrack.length - totalLength;

      gsap.to(progressObj, {
        progress: maxSteps,
        duration: 0.38,
        ease: 'power2.in',
        onUpdate: () => {
          const currentHeadIdx = Math.floor(progressObj.progress);
          const fraction = progressObj.progress - currentHeadIdx;

          // Compute moving polyline slice
          const slicePoints: { x: number; y: number }[] = [];
          for (let i = 0; i < totalLength; i++) {
            const trackIdx = currentHeadIdx + i;
            if (trackIdx < extendedTrack.length - 1) {
              const pA = extendedTrack[trackIdx];
              const pB = extendedTrack[trackIdx + 1];
              slicePoints.push({
                x: pA.x + (pB.x - pA.x) * fraction,
                y: pA.y + (pB.y - pA.y) * fraction
              });
            }
          }

          graphics.clear();
          if (slicePoints.length >= 2) {
            drawTexturedRope(graphics, slicePoints, rope.exitDirection, rope.color, ropeWidth);
          }
        },
        onComplete
      });
    },

    /**
     * Animates blocked bump and spring recoil when an obstructed rope is tapped.
     * 
     * @param {number} cellSize - Cell dimension.
     * @param {number} originX - Board X.
     * @param {number} originY - Board Y.
     * @returns {void}
     * @description Shifts rope slightly forward along its exit direction, then snaps back with elastic recoil.
     */
    animateBlockedShake: (cellSize: number, originX: number, originY: number) => {
      const originalPoints = rope.body.map(pt => gridToPixel(pt, cellSize, originX, originY));
      const ropeWidth = Math.max(3.5, cellSize * 0.28);
      const dir = rope.exitDirection;
      const bumpDist = cellSize * 0.35;

      const bumpObj = { offset: 0 };

      gsap.timeline()
        .to(bumpObj, {
          offset: bumpDist,
          duration: 0.08,
          ease: 'power2.out',
          onUpdate: () => {
            const bumped = originalPoints.map(p => ({
              x: p.x + dir.dx * bumpObj.offset,
              y: p.y + dir.dy * bumpObj.offset
            }));
            graphics.clear();
            drawTexturedRope(graphics, bumped, dir, 0xFF3366, ropeWidth); // Flash red on block
          }
        })
        .to(bumpObj, {
          offset: 0,
          duration: 0.2,
          ease: 'elastic.out(1.2, 0.4)',
          onUpdate: () => {
            const bumped = originalPoints.map(p => ({
              x: p.x + dir.dx * bumpObj.offset,
              y: p.y + dir.dy * bumpObj.offset
            }));
            graphics.clear();
            drawTexturedRope(graphics, bumped, dir, rope.color, ropeWidth);
          }
        });
    }
  };
}
