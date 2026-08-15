/**
 * @file ropeRenderer.ts
 * @description Ultra-thin, razor-sharp rope rendering matching 1.jpg/2.jpg with delicate arrowheads, tiny knot tails, and snake pulling physics.
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
 * @param {number} cellSize - Pixel dimensions per cell.
 * @param {number} originX - Board X offset.
 * @param {number} originY - Board Y offset.
 * @returns {{ x: number; y: number }} Pixel coordinate.
 * @description Computes center of cell: pixel = origin + (coord + 0.5) * cellSize.
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
 * Draws a sharp, delicate directional arrowhead matching reference designs (1.jpg & 2.jpg).
 * 
 * @param {PIXI.Graphics} graphics - Target graphics context.
 * @param {{ x: number; y: number }} head - Head pixel coordinate.
 * @param {Vector2D} dir - Direction vector.
 * @param {number} arrowSize - Scale factor for the arrow.
 * @param {number} color - Color of the arrow.
 * @returns {void}
 * @description Renders a sharp, elegant chevron arrowhead at the rope exit tip.
 */
export function drawDelicateArrowHead(
  graphics: PIXI.Graphics,
  head: { x: number; y: number },
  dir: Vector2D,
  arrowSize: number,
  color: number
): void {
  const angle = Math.atan2(dir.dy, dir.dx);
  const length = Math.max(5, arrowSize * 1.6);
  const width = Math.max(4, arrowSize * 1.1);

  const tipX = head.x + Math.cos(angle) * (arrowSize * 0.7);
  const tipY = head.y + Math.sin(angle) * (arrowSize * 0.7);

  const leftX = tipX - Math.cos(angle) * length + Math.sin(angle) * width;
  const leftY = tipY - Math.sin(angle) * length - Math.cos(angle) * width;

  const rightX = tipX - Math.cos(angle) * length - Math.sin(angle) * width;
  const rightY = tipY - Math.sin(angle) * length + Math.cos(angle) * width;

  // Solid crisp chevron arrow
  graphics.poly([
    { x: tipX, y: tipY },
    { x: leftX, y: leftY },
    { x: tipX - Math.cos(angle) * (length * 0.55), y: tipY - Math.sin(angle) * (length * 0.55) },
    { x: rightX, y: rightY }
  ]);
  graphics.fill({ color });
}

/**
 * Renders an ultra-thin, razor-sharp rope polyline with crisp joins, tiny knot tail, and sharp arrowhead.
 * 
 * @param {PIXI.Graphics} graphics - Graphics context.
 * @param {{ x: number; y: number }[]} points - Array of vertex coordinates.
 * @param {Vector2D} dir - Exit direction.
 * @param {number} color - Color code.
 * @param {number} lineWidth - Razor-thin stroke width (1.8px - 2.8px).
 * @returns {void}
 * @description Draws smooth thin polyline stroke, small round tail dot, and front arrowhead.
 */
export function drawUltraThinRope(
  graphics: PIXI.Graphics,
  points: { x: number; y: number }[],
  dir: Vector2D,
  color: number,
  lineWidth: number
): void {
  if (points.length < 2) return;

  // 1. Primary Razor-Thin Polyline
  graphics.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    graphics.lineTo(points[i].x, points[i].y);
  }
  graphics.stroke({
    color: color,
    width: lineWidth,
    cap: 'round',
    join: 'round'
  });

  // 2. Tiny Knot Dot at Tail (First coordinate)
  const tail = points[0];
  graphics.circle(tail.x, tail.y, lineWidth * 1.0);
  graphics.fill({ color });

  // 3. Sharp Delicate Arrowhead at Head (Last coordinate)
  const head = points[points.length - 1];
  drawDelicateArrowHead(graphics, head, dir, lineWidth * 1.8, color);
}

/**
 * Creates the interactive graphic handle for an ultra-thin rope with true snake pulling physics.
 * 
 * @param {Rope} rope - The target rope data.
 * @param {(rope: Rope) => void} onKnotTap - Tap callback.
 * @returns {RopeGraphicHandle} Graphic handle.
 * @description Builds container, hit areas, and path-following snake slither physics.
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
    // Razor-thin line stroke (1.8px - 2.8px)
    const lineWidth = Math.max(1.8, Math.min(2.8, cellSize * 0.18));
    const points = rope.body.map(pt => gridToPixel(pt, cellSize, originX, originY));
    drawUltraThinRope(graphics, points, rope.exitDirection, rope.color, lineWidth);
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
      const lineWidth = Math.max(1.8, Math.min(2.8, cellSize * 0.18));
      const totalLength = originalPoints.length;

      const extendedTrack = [...originalPoints];
      const head = originalPoints[originalPoints.length - 1];
      const dir = rope.exitDirection;

      for (let step = 1; step <= 35; step++) {
        extendedTrack.push({
          x: head.x + dir.dx * cellSize * step,
          y: head.y + dir.dy * cellSize * step
        });
      }

      const progressObj = { progress: 0 };
      const maxSteps = extendedTrack.length - totalLength;

      gsap.to(progressObj, {
        progress: maxSteps,
        duration: 0.32,
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
            drawUltraThinRope(graphics, slicePoints, rope.exitDirection, rope.color, lineWidth);
          }
        },
        onComplete
      });
    },

    animateBlockedShake: (cellSize: number, originX: number, originY: number) => {
      const originalPoints = rope.body.map(pt => gridToPixel(pt, cellSize, originX, originY));
      const lineWidth = Math.max(1.8, Math.min(2.8, cellSize * 0.18));
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
            drawUltraThinRope(graphics, bumped, dir, 0xFF3366, lineWidth);
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
            drawUltraThinRope(graphics, bumped, dir, rope.color, lineWidth);
          }
        });
    }
  };
}
