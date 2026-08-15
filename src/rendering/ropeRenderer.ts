/**
 * @file ropeRenderer.ts
 * @description Ultra-crisp compact rope rendering with procedural braided fiber twist texture, sharp micro-arrowheads, tactile knot tails, and snake pulling physics.
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
 * @param {GridCoord} coord - Discrete grid coordinate.
 * @param {number} cellSize - Pixel dimensions per cell.
 * @param {number} originX - Board X offset.
 * @param {number} originY - Board Y offset.
 * @returns {{ x: number; y: number }} Pixel coordinate.
 * @description Computes cell center: pixel = origin + (coord + 0.5) * cellSize.
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
 * Draws a sharp directional arrowhead at the head point of a compact rope.
 * 
 * @param {PIXI.Graphics} graphics - Target graphics context.
 * @param {{ x: number; y: number }} head - Head pixel coordinate.
 * @param {Vector2D} dir - Direction vector.
 * @param {number} size - Arrow scale.
 * @param {number} color - Rope color.
 * @returns {void}
 * @description Renders a sharp directional arrowhead rotated along exit vector.
 */
export function drawArrowHead(
  graphics: PIXI.Graphics,
  head: { x: number; y: number },
  dir: Vector2D,
  size: number,
  color: number
): void {
  const angle = Math.atan2(dir.dy, dir.dx);
  const arrowLength = Math.max(7, size * 1.8);
  const arrowWidth = Math.max(5, size * 1.2);

  const tipX = head.x + Math.cos(angle) * (size * 0.9);
  const tipY = head.y + Math.sin(angle) * (size * 0.9);

  const leftX = tipX - Math.cos(angle) * arrowLength + Math.sin(angle) * arrowWidth;
  const leftY = tipY - Math.sin(angle) * arrowLength - Math.cos(angle) * arrowWidth;

  const rightX = tipX - Math.cos(angle) * arrowLength - Math.sin(angle) * arrowWidth;
  const rightY = tipY - Math.sin(angle) * arrowLength + Math.cos(angle) * arrowWidth;

  graphics.poly([
    { x: tipX, y: tipY },
    { x: leftX, y: leftY },
    { x: tipX - Math.cos(angle) * (arrowLength * 0.65), y: tipY - Math.sin(angle) * (arrowLength * 0.65) },
    { x: rightX, y: rightY }
  ]);
  graphics.fill({ color });
  graphics.stroke({ color: 0x060911, width: 1.5 });
}

/**
 * Draws a realistic braided textured rope with high-density fiber weaves and highlights.
 * 
 * @param {PIXI.Graphics} graphics - Graphics context.
 * @param {{ x: number; y: number }[]} points - Array of vertex coordinates.
 * @param {Vector2D} dir - Exit direction.
 * @param {number} color - Color code.
 * @param {number} ropeWidth - Thickness in pixels.
 * @returns {void}
 * @description Renders multi-ply braided rope twists, dark outer borders, fiber highlights, knot tail, and arrowhead.
 */
export function drawTexturedRope(
  graphics: PIXI.Graphics,
  points: { x: number; y: number }[],
  dir: Vector2D,
  color: number,
  ropeWidth: number
): void {
  if (points.length < 2) return;

  // 1. Dark Outline Underlay for separation
  graphics.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    graphics.lineTo(points[i].x, points[i].y);
  }
  graphics.stroke({
    color: 0x060911,
    width: ropeWidth + 2.5,
    cap: 'round',
    join: 'round'
  });

  // 2. Primary Rope Body Core
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

  // 3. Braided Fiber Twist Texture (Diagonal weave dashes)
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(2, Math.floor(dist / (ropeWidth * 1.2)));

    for (let s = 0; s < steps; s++) {
      const t = (s + 0.5) / steps;
      const mx = p1.x + dx * t;
      const my = p1.y + dy * t;

      // Perpendicular normal vector
      const nx = -dy / dist;
      const ny = dx / dist;

      const stitchLen = ropeWidth * 0.45;
      graphics.moveTo(mx - nx * stitchLen, my - ny * stitchLen);
      graphics.lineTo(mx + nx * stitchLen, my + ny * stitchLen);
      graphics.stroke({
        color: 0xFFFFFF,
        width: Math.max(1, ropeWidth * 0.35),
        alpha: 0.55,
        cap: 'round'
      });
    }
  }

  // 4. Tail Knot (Knot button at the first coordinate)
  const tail = points[0];
  graphics.circle(tail.x, tail.y, ropeWidth * 0.9);
  graphics.fill({ color: 0xFFFFFF });
  graphics.circle(tail.x, tail.y, ropeWidth * 0.7);
  graphics.fill({ color: color });
  graphics.circle(tail.x, tail.y, ropeWidth * 0.35);
  graphics.fill({ color: 0x060911 });

  // 5. Head Arrow (Last coordinate)
  const head = points[points.length - 1];
  drawArrowHead(graphics, head, dir, ropeWidth, color);
}

/**
 * Creates the interactive graphic handle for a compact textured rope.
 * 
 * @param {Rope} rope - The target rope data.
 * @param {(rope: Rope) => void} onKnotTap - Tap callback.
 * @returns {RopeGraphicHandle} Graphic handle.
 * @description Constructs PixiJS container, pointer hit areas, braided graphics, and snake slither physics.
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

  function redraw(cellSize: number, originX: number, originY: number): void {
    graphics.clear();
    const ropeWidth = Math.max(2.8, cellSize * 0.24);
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

    animateSlitherOut: (cellSize: number, originX: number, originY: number, onComplete: () => void) => {
      const originalPoints = rope.body.map(pt => gridToPixel(pt, cellSize, originX, originY));
      const ropeWidth = Math.max(2.8, cellSize * 0.24);
      const totalLength = originalPoints.length;

      const extendedTrack = [...originalPoints];
      const head = originalPoints[originalPoints.length - 1];
      const dir = rope.exitDirection;

      for (let step = 1; step <= 30; step++) {
        extendedTrack.push({
          x: head.x + dir.dx * cellSize * step,
          y: head.y + dir.dy * cellSize * step
        });
      }

      const progressObj = { progress: 0 };
      const maxSteps = extendedTrack.length - totalLength;

      gsap.to(progressObj, {
        progress: maxSteps,
        duration: 0.35,
        ease: 'power2.in',
        onUpdate: () => {
          const currentHeadIdx = Math.floor(progressObj.progress);
          const fraction = progressObj.progress - currentHeadIdx;

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

    animateBlockedShake: (cellSize: number, originX: number, originY: number) => {
      const originalPoints = rope.body.map(pt => gridToPixel(pt, cellSize, originX, originY));
      const ropeWidth = Math.max(2.8, cellSize * 0.24);
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
            drawTexturedRope(graphics, bumped, dir, 0xFF3366, ropeWidth);
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
