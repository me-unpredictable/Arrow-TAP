/**
 * @file ropeRenderer.ts
 * @description Razor-thin rope graphics renderer with delicate sharp chevrons, clean tail ends (no dot), vibrant techno palette, and true path-following snake slither physics.
 */

import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { GridCoord, Rope, Vector2D } from '../types';

export interface RopeGraphicHandle {
  container: PIXI.Container;
  updateLayout: (cellSize: number, originX: number, originY: number) => void;
  animateSlitherOut: (cellSize: number, originX: number, originY: number, onComplete: () => void) => void;
  animateBlockedShake: (cellSize: number, originX: number, originY: number) => void;
}

/**
 * Converts a grid coordinate to canvas pixel coordinates.
 * 
 * @param {GridCoord} coord - Grid coordinate.
 * @param {number} cellSize - Pixel size per grid cell.
 * @param {number} originX - Left offset.
 * @param {number} originY - Top offset.
 * @returns {{ x: number; y: number }} Pixel coordinate.
 * @description Computes centered cell pixel position.
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
 * @description Renders a sharp, elegant chevron arrowhead colinear with the final segment.
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
 * Renders an ultra-thin, razor-sharp rope polyline with clean tail (no dot) and sharp arrowhead.
 * 
 * @param {PIXI.Graphics} graphics - Graphics context.
 * @param {{ x: number; y: number }[]} points - Array of vertex coordinates.
 * @param {Vector2D} dir - Exit direction.
 * @param {number} color - Color code.
 * @param {number} lineWidth - Stroke width (1.8px - 2.8px).
 * @returns {void}
 * @description Draws sleek polyline stroke and sharp front arrowhead without any tail 'o' dot.
 */
export function drawUltraThinRope(
  graphics: PIXI.Graphics,
  points: { x: number; y: number }[],
  dir: Vector2D,
  color: number,
  lineWidth: number
): void {
  if (points.length < 2) return;

  // 1. Primary Razor-Thin Polyline with clean round caps
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

  // 2. Sharp Delicate Arrowhead at Head (Last coordinate)
  const head = points[points.length - 1];
  drawDelicateArrowHead(graphics, head, dir, lineWidth * 1.8, color);
}

/**
 * Creates the interactive graphic handle for an arrow with true snake pulling physics.
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

  container.on('pointerdown', (e) => {
    e.stopPropagation();
    onKnotTap(rope);
  });

  const getLineWidth = (cellSize: number) => {
    return Math.max(1.8, Math.min(2.8, cellSize * 0.12));
  };

  return {
    container,

    updateLayout: (cellSize: number, originX: number, originY: number) => {
      graphics.clear();
      const points = rope.body.map(pt => gridToPixel(pt, cellSize, originX, originY));
      const lineWidth = getLineWidth(cellSize);

      drawUltraThinRope(graphics, points, rope.exitDirection, rope.color, lineWidth);

      // Expand interactive hit area along the rope body
      container.hitArea = new PIXI.Rectangle(
        Math.min(...points.map(p => p.x)) - cellSize * 0.5,
        Math.min(...points.map(p => p.y)) - cellSize * 0.5,
        Math.max(...points.map(p => p.x)) - Math.min(...points.map(p => p.x)) + cellSize,
        Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y)) + cellSize
      );
    },

    animateSlitherOut: (cellSize: number, originX: number, originY: number, onComplete: () => void) => {
      container.eventMode = 'none';

      const originalPoints = rope.body.map(pt => gridToPixel(pt, cellSize, originX, originY));
      const head = originalPoints[originalPoints.length - 1];
      const dir = rope.exitDirection;

      const track = [...originalPoints];
      const escapeSteps = 12;
      for (let s = 1; s <= escapeSteps; s++) {
        track.push({
          x: head.x + dir.dx * cellSize * s,
          y: head.y + dir.dy * cellSize * s
        });
      }

      const totalSegments = track.length - 1;
      const originalLength = originalPoints.length - 1;
      const lineWidth = getLineWidth(cellSize);

      const animState = { progress: 0 };

      gsap.to(animState, {
        progress: 1,
        duration: 0.28,
        ease: 'power2.in',
        onUpdate: () => {
          graphics.clear();

          const headIndex = originalLength + animState.progress * escapeSteps;
          const tailIndex = Math.max(0, headIndex - originalLength * (1 - animState.progress * 0.5));

          const currentSlice: { x: number; y: number }[] = [];
          const startI = Math.floor(tailIndex);
          const endI = Math.min(totalSegments, Math.ceil(headIndex));

          for (let i = startI; i <= endI; i++) {
            if (i >= 0 && i < track.length) {
              currentSlice.push(track[i]);
            }
          }

          if (currentSlice.length >= 2) {
            drawUltraThinRope(graphics, currentSlice, dir, rope.color, lineWidth);
            graphics.alpha = Math.max(0, 1 - animState.progress * 0.85);
          }
        },
        onComplete: () => {
          onComplete();
        }
      });
    },

    animateBlockedShake: (cellSize: number, originX: number, originY: number) => {
      const originalPoints = rope.body.map(pt => gridToPixel(pt, cellSize, originX, originY));
      const dir = rope.exitDirection;
      const bumpDistance = cellSize * 0.25;
      const lineWidth = getLineWidth(cellSize);

      const bumpState = { offset: 0 };

      gsap.timeline()
        .to(bumpState, {
          offset: bumpDistance,
          duration: 0.06,
          ease: 'power1.out',
          onUpdate: () => {
            graphics.clear();
            const bumpedPoints = originalPoints.map(p => ({
              x: p.x + dir.dx * bumpState.offset,
              y: p.y + dir.dy * bumpState.offset
            }));
            drawUltraThinRope(graphics, bumpedPoints, dir, 0xFF0033, lineWidth * 1.3);
          }
        })
        .to(bumpState, {
          offset: 0,
          duration: 0.12,
          ease: 'elastic.out(1.2, 0.4)',
          onUpdate: () => {
            graphics.clear();
            const bumpedPoints = originalPoints.map(p => ({
              x: p.x + dir.dx * bumpState.offset,
              y: p.y + dir.dy * bumpState.offset
            }));
            drawUltraThinRope(graphics, bumpedPoints, dir, rope.color, lineWidth);
          }
        });
    }
  };
}
