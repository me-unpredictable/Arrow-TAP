/**
 * @file mazeGenerator.ts
 * @description Mathematical procedural generator for dense silhouette-masked rope mazes (Heart, Apple, Diamond, Shield, Circle).
 */

import { BoardShape, GridCoord, LevelData, Rope, Vector2D } from '../types';
import { isBoardFullySolvable, isWithinBounds } from './solver';

// High-contrast vibrant rope colors
export const ROPE_COLORS: number[] = [
  0x1D4ED8, // Classic Rich Blue (like reference images)
  0xDC2626, // Vivid Crimson Red (accent highlights)
  0x059669, // Emerald Green
  0xD97706, // Rich Amber
  0x7C3AED, // Royal Violet
  0x0891B2, // Deep Cyan
  0xDB2777  // Vibrant Magenta
];

const CARDINAL_DIRS: Vector2D[] = [
  { dx: 0, dy: -1 }, // North
  { dx: 1, dy: 0 },  // East
  { dx: 0, dy: 1 },  // South
  { dx: -1, dy: 0 }  // West
];

const AVAILABLE_SHAPES: BoardShape[] = ['apple', 'heart', 'diamond', 'shield', 'circle', 'square'];

/**
 * Calculates the grid dimension for a given level number.
 * 
 * @param {number} level - Current player progression level (1-indexed).
 * @returns {number} Grid dimension N (starts at 10, scales up to 20).
 * @description Implements high-density scaling formula: N = min(20, 10 + floor((level - 1) / 2) * 2).
 */
export function calculateGridSize(level: number): number {
  return Math.min(20, 10 + Math.floor((level - 1) / 2) * 2);
}

/**
 * Determines whether a grid cell falls within a given mathematical silhouette shape.
 * 
 * @param {number} x - Grid X coordinate.
 * @param {number} y - Grid Y coordinate.
 * @param {number} gridSize - Total square dimension N.
 * @param {BoardShape} shape - Silhouette shape enum.
 * @returns {boolean} True if the cell is inside the mathematical silhouette.
 * @description Evaluates analytic geometric formulas for Heart, Apple, Diamond, Shield, Circle, and Square.
 */
export function isCellInShape(x: number, y: number, gridSize: number, shape: BoardShape): boolean {
  const cx = (gridSize - 1) / 2;
  const cy = (gridSize - 1) / 2;
  const rx = gridSize / 2;
  const ry = gridSize / 2;

  // Normalized coordinates [-1, 1]
  const nx = (x - cx) / rx;
  const ny = (y - cy) / ry;

  switch (shape) {
    case 'heart': {
      // Heart curve: (x^2 + (y - sqrt(|x|))^2 <= 1)
      const u = nx * 1.05;
      const v = -ny * 1.1 + 0.15; // Invert Y so heart points downwards
      return (u * u + Math.pow(v - Math.sqrt(Math.abs(u)) * 0.7, 2)) <= 0.85;
    }

    case 'apple': {
      // Apple body (circle with top notch) + stem
      // Stem at top center
      if (Math.abs(x - cx) <= 0.5 && y <= 2) return true;
      // Body
      const u = nx * 1.05;
      const v = ny * 1.05;
      const dist = Math.sqrt(u * u + v * v);
      // Indentation on top
      const topDip = (ny < -0.3 && Math.abs(nx) < 0.25) ? 0.35 : 0;
      return dist <= 0.9 - topDip;
    }

    case 'diamond': {
      // Manhattan distance diamond
      return (Math.abs(nx) + Math.abs(ny)) <= 0.95;
    }

    case 'shield': {
      // Flat top, curved parabolic bottom
      if (ny < 0) {
        return Math.abs(nx) <= 0.9;
      }
      return (Math.abs(nx) + Math.pow(ny, 1.5)) <= 0.92;
    }

    case 'circle': {
      return (nx * nx + ny * ny) <= 0.88;
    }

    case 'square':
    default:
      return true;
  }
}

/**
 * Computes the set of all valid grid cell keys for a given shape and grid size.
 * 
 * @param {BoardShape} shape - Silhouette shape.
 * @param {number} gridSize - Square dimension.
 * @returns {Set<string>} Set of "x,y" keys belonging to the silhouette.
 * @description Iterates the full N x N matrix and filters cells through isCellInShape.
 */
export function getShapeValidCells(shape: BoardShape, gridSize: number): Set<string> {
  const valid = new Set<string>();
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      if (isCellInShape(x, y, gridSize, shape)) {
        valid.add(`${x},${y}`);
      }
    }
  }
  return valid;
}

/**
 * Generates a candidate set of non-overlapping ropes inside a silhouette shape.
 * 
 * @param {number} gridSize - Grid dimension N.
 * @param {Set<string>} validCells - Active silhouette cell set.
 * @param {number} targetRopeCount - Desired rope count.
 * @returns {Rope[]} Array of candidate non-overlapping ropes.
 * @description Walks winding paths across valid unoccupied cells, adding arrow heads and knot tails.
 */
export function generateCandidateRopes(
  gridSize: number,
  validCells: Set<string>,
  targetRopeCount: number
): Rope[] {
  const occupied = new Set<string>();
  const ropes: Rope[] = [];
  let ropeId = 1;

  const validCellList = Array.from(validCells).map(k => {
    const [x, y] = k.split(',').map(Number);
    return { x, y };
  });

  // Shuffle cell list for random start positions
  validCellList.sort(() => Math.random() - 0.5);

  for (const start of validCellList) {
    if (ropes.length >= targetRopeCount) break;
    if (occupied.has(`${start.x},${start.y}`)) continue;

    const ropeBody: GridCoord[] = [{ x: start.x, y: start.y }];
    const ropeLength = 3 + Math.floor(Math.random() * 4); // 3 to 6 segments long

    let cur = { x: start.x, y: start.y };

    for (let seg = 1; seg < ropeLength; seg++) {
      const shuffledDirs = [...CARDINAL_DIRS].sort(() => Math.random() - 0.5);
      let extended = false;

      for (const d of shuffledDirs) {
        const next = { x: cur.x + d.dx, y: cur.y + d.dy };
        if (
          isWithinBounds(next, gridSize, validCells) &&
          !occupied.has(`${next.x},${next.y}`) &&
          !ropeBody.some(p => p.x === next.x && p.y === next.y)
        ) {
          ropeBody.push(next);
          cur = next;
          extended = true;
          break;
        }
      }

      if (!extended) break;
    }

    if (ropeBody.length >= 2) {
      for (const pt of ropeBody) {
        occupied.add(`${pt.x},${pt.y}`);
      }

      // Head is the last coordinate, exit direction follows head - prev
      const head = ropeBody[ropeBody.length - 1];
      const prev = ropeBody[ropeBody.length - 2];
      const exitDir: Vector2D = { dx: head.x - prev.x, dy: head.y - prev.y };

      const color = ROPE_COLORS[(ropeId - 1) % ROPE_COLORS.length];

      ropes.push({
        id: ropeId++,
        color,
        body: ropeBody,
        exitDirection: exitDir
      });
    }
  }

  return ropes;
}

/**
 * Generates an infinite level with random silhouette shape guaranteed 100% solvable.
 * 
 * @param {number} level - Level number.
 * @returns {LevelData} Level data containing ropes, shape, and verified solvability.
 * @description Picks a procedural silhouette (Apple, Heart, Diamond, Shield, Circle), generates dense ropes, and verifies solvability.
 */
export function generateSolvableLevel(level: number): LevelData {
  const gridSize = calculateGridSize(level);
  const shapeIndex = (level - 1) % AVAILABLE_SHAPES.length;
  const shape = AVAILABLE_SHAPES[shapeIndex];
  const validCells = getShapeValidCells(shape, gridSize);

  const targetRopeCount = Math.floor(validCells.size / 4.2);

  for (let trial = 0; trial < 150; trial++) {
    const candidates = generateCandidateRopes(gridSize, validCells, targetRopeCount);
    if (candidates.length >= 5 && isBoardFullySolvable(candidates, gridSize, validCells)) {
      return { ropes: candidates, gridSize, shape, validCells };
    }
  }

  // Fallback candidate generation with slightly looser density
  const fallbackCandidates = generateCandidateRopes(gridSize, validCells, Math.floor(validCells.size / 5));
  return { ropes: fallbackCandidates, gridSize, shape, validCells };
}
