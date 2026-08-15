/**
 * @file ropeRenderer.ts
 * @description PixiJS rendering pipeline for non-overlapping ropes, tactile knots, and slithering escape animations.
 */

import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { GridCoord, Rope } from '../types';

export interface RopeGraphicHandle {
  rope: Rope;
  container: PIXI.Container;
  knotGraphics: PIXI.Graphics;
  updateLayout: (cellSize: number, originX: number, originY: number) => void;
  animateSlitherOut: (cellSize: number, onComplete: () => void) => void;
  animateBlockedShake: () => void;
}

/**
 * Converts grid coordinates to canvas pixel positions.
 * 
 * @param {GridCoord} coord - Discrete grid position.
 * @param {number} cellSize - Width/height of a single cell in pixels.
 * @param {number} originX - Left offset of the square board.
 * @param {number} originY - Top offset of the square board.
 * @returns {{ x: number; y: number }} Computed pixel coordinates at cell center.
 * @description Implements mathematical transform: pixel = origin + (coord + 0.5) * cellSize.
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
 * Constructs the visual PixiJS graphic handle for a single rope and its interactive knot.
 * 
 * @param {Rope} rope - The rope data structure.
 * @param {(rope: Rope) => void} onKnotTap - Callback invoked when the rope's knot is tapped.
 * @returns {RopeGraphicHandle} Graphic handle containing rendering methods and animation triggers.
 * @description Renders segmented rope paths with rounded endpoints, directional arrows, and a tactile tappable knot.
 */
export function createRopeGraphic(
  rope: Rope,
  onKnotTap: (rope: Rope) => void
): RopeGraphicHandle {
  const container = new PIXI.Container();

  const bodyGraphics = new PIXI.Graphics();
  const knotContainer = new PIXI.Container();
  const knotGraphics = new PIXI.Graphics();

  container.addChild(bodyGraphics);
  container.addChild(knotContainer);
  knotContainer.addChild(knotGraphics);

  // Only the knot is interactive
  knotContainer.eventMode = 'static';
  knotContainer.cursor = 'pointer';

  /**
   * Draws the rope body and its interactive knot based on updated cell metrics.
   * 
   * @param {number} cellSize - Pixel dimensions per grid cell.
   * @param {number} originX - Board origin X.
   * @param {number} originY - Board origin Y.
   * @returns {void}
   * @description Clears and redraws line paths, segment joins, directional arrows, and knot spheres.
   */
  function redraw(cellSize: number, originX: number, originY: number): void {
    bodyGraphics.clear();
    knotGraphics.clear();

    if (rope.body.length < 2) return;

    const thickness = cellSize * 0.42;
    const innerThickness = thickness * 0.4;

    const points = rope.body.map(pt => gridToPixel(pt, cellSize, originX, originY));

    // 1. Draw Base Rope Outline / Shadow
    bodyGraphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      bodyGraphics.lineTo(points[i].x, points[i].y);
    }
    bodyGraphics.stroke({
      color: 0x0A0E17,
      width: thickness + 6,
      cap: 'round',
      join: 'round'
    });

    // 2. Draw Main Colored Rope Body
    bodyGraphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      bodyGraphics.lineTo(points[i].x, points[i].y);
    }
    bodyGraphics.stroke({
      color: rope.color,
      width: thickness,
      cap: 'round',
      join: 'round'
    });

    // 3. Draw Bright Inner Core Highlight
    bodyGraphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      bodyGraphics.lineTo(points[i].x, points[i].y);
    }
    bodyGraphics.stroke({
      color: 0xFFFFFF,
      width: innerThickness,
      alpha: 0.5,
      cap: 'round',
      join: 'round'
    });

    // 4. Position and Render the Interactive Knot
    const knotPixel = points[rope.knotIndex];
    knotContainer.x = knotPixel.x;
    knotContainer.y = knotPixel.y;

    const knotRadius = cellSize * 0.38;

    // Knot Outer Ring
    knotGraphics.circle(0, 0, knotRadius + 3);
    knotGraphics.fill({ color: 0xFFFFFF });

    // Knot Inner Core
    knotGraphics.circle(0, 0, knotRadius);
    knotGraphics.fill({ color: rope.color });

    // Knot Center Node
    knotGraphics.circle(0, 0, knotRadius * 0.45);
    knotGraphics.fill({ color: 0x0B0F19 });

    // Directional Arrow on Knot
    const arrowDir = rope.exitDirection;
    const arrowLen = knotRadius * 0.8;
    const tipX = arrowDir.dx * arrowLen;
    const tipY = arrowDir.dy * arrowLen;

    knotGraphics.moveTo(0, 0);
    knotGraphics.lineTo(tipX, tipY);
    knotGraphics.stroke({ color: 0xFFFFFF, width: 3, cap: 'round' });
  }

  // Knot pulse animation
  gsap.to(knotContainer.scale, {
    x: 1.15,
    y: 1.15,
    duration: 0.5,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  // Tap Event
  knotContainer.on('pointerdown', (e) => {
    e.stopPropagation();
    onKnotTap(rope);
  });

  return {
    rope,
    container,
    knotGraphics,

    /**
     * Re-renders the rope with current grid metrics.
     * 
     * @param {number} cellSize - Cell width/height.
     * @param {number} originX - Board origin X.
     * @param {number} originY - Board origin Y.
     * @returns {void}
     * @description Updates dimensions during window resize or board scaling.
     */
    updateLayout: (cellSize: number, originX: number, originY: number) => {
      redraw(cellSize, originX, originY);
    },

    /**
     * Animates the rope slithering smoothly off the board along its exit trajectory.
     * 
     * @param {number} cellSize - Cell dimension.
     * @param {() => void} onComplete - Callback when slither animation finishes.
     * @returns {void}
     * @description Smoothly translates container along exit vector and dissolves alpha.
     */
    animateSlitherOut: (cellSize: number, onComplete: () => void) => {
      const exitDist = cellSize * 10;
      const targetX = container.x + rope.exitDirection.dx * exitDist;
      const targetY = container.y + rope.exitDirection.dy * exitDist;

      gsap.to(container, {
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: 0.35,
        ease: 'power2.in',
        onComplete
      });
    },

    /**
     * Triggers a fast recoil wobble when a blocked knot is illegally tapped.
     * 
     * @param {void} - No input parameters.
     * @returns {void}
     * @description Shakes knot scale and colors it red temporarily for error feedback.
     */
    animateBlockedShake: () => {
      gsap.timeline()
        .to(knotContainer, { x: '+=6', duration: 0.04, yoyo: true, repeat: 3 })
        .to(knotContainer.scale, { x: 0.8, y: 0.8, duration: 0.08, yoyo: true, repeat: 1 });
    }
  };
}
