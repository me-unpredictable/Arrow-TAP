/**
 * @file solver.ts
 * @description Mathematical raycasting and path obstruction solver for high-density silhouette rope mazes.
 */

import { GridCoord, Rope, Vector2D } from '../types';

/**
 * Checks if a 2D coordinate is within valid shape cells or grid boundaries.
 * 
 * @param {GridCoord} coord - Target coordinate to evaluate.
 * @param {number} gridSize - Dimension of the square grid matrix.
 * @param {Set<string>} [validCells] - Optional set of valid shape cells.
 * @returns {boolean} True if coordinate is inside the board.
 * @description Evaluates mathematical bounding inequality: 0 <= x < N and 0 <= y < N (and within valid shape cells if provided).
 */
export function isWithinBounds(coord: GridCoord, gridSize: number, validCells?: Set<string>): boolean {
  const inGrid = coord.x >= 0 && coord.x < gridSize && coord.y >= 0 && coord.y < gridSize;
  if (!inGrid) return false;
  if (validCells && validCells.size > 0) {
    return validCells.has(`${coord.x},${coord.y}`);
  }
  return true;
}

/**
 * Determines whether a given rope has an unobstructed escape path out of the board.
 * 
 * @param {Rope} rope - The target rope being evaluated.
 * @param {Rope[]} allActiveRopes - All ropes currently active on the board.
 * @param {number} gridSize - Dimension of the square board.
 * @param {Set<string>} [validCells] - Valid shape boundary cells.
 * @returns {boolean} True if the rope's forward head arrow has a clear raycast exit to outside the board.
 * @description Raycasts from the rope's head (last coordinate) along its exitDirection vector.
 * If every step along the exit vector until leaving the shape/grid is unoccupied by any other rope, returns true.
 */
export function canRopeExit(
  rope: Rope,
  allActiveRopes: Rope[],
  gridSize: number,
  validCells?: Set<string>
): boolean {
  if (rope.body.length < 2) return true;

  const head = rope.body[rope.body.length - 1];
  const dir: Vector2D = rope.exitDirection;

  // Build coordinate lookup map for all OTHER ropes on the board
  const occupiedByOthers = new Set<string>();
  for (const other of allActiveRopes) {
    if (other.id === rope.id) continue;
    for (const pt of other.body) {
      occupiedByOthers.add(`${pt.x},${pt.y}`);
    }
  }

  // Raycast forward from head along exitDirection until leaving board/shape bounds
  let curX = head.x + dir.dx;
  let curY = head.y + dir.dy;

  while (isWithinBounds({ x: curX, y: curY }, gridSize, validCells)) {
    if (occupiedByOthers.has(`${curX},${curY}`)) {
      return false; // Path is blocked by another rope
    }
    curX += dir.dx;
    curY += dir.dy;
  }

  return true; // Unobstructed path to perimeter
}

/**
 * Finds all ropes on the current board that can currently exit without collision.
 * 
 * @param {Rope[]} ropes - Array of all active ropes.
 * @param {number} gridSize - Square board dimension.
 * @param {Set<string>} [validCells] - Shape boundary cells.
 * @returns {Rope[]} Array of unblocked ropes.
 * @description Filters active ropes using the mathematical raycast exit formula.
 */
export function findSolvableRopes(
  ropes: Rope[],
  gridSize: number,
  validCells?: Set<string>
): Rope[] {
  return ropes.filter(r => canRopeExit(r, ropes, gridSize, validCells));
}

/**
 * Mathematically validates whether a complete board state is fully solvable from start to finish.
 * 
 * @param {Rope[]} initialRopes - Initial set of ropes on the board.
 * @param {number} gridSize - Square board dimension.
 * @param {Set<string>} [validCells] - Shape boundary cells.
 * @returns {boolean} True if the entire board can be untangled to 0 remaining ropes.
 * @description Simulates sequential untangling steps until all ropes are cleared or a deadlock occurs.
 */
export function isBoardFullySolvable(
  initialRopes: Rope[],
  gridSize: number,
  validCells?: Set<string>
): boolean {
  let active = [...initialRopes];
  
  while (active.length > 0) {
    const solvable = findSolvableRopes(active, gridSize, validCells);
    if (solvable.length === 0) {
      return false; // Deadlock: no rope can escape
    }
    // Remove the first unblocked rope and continue simulation
    const freedId = solvable[0].id;
    active = active.filter(r => r.id !== freedId);
  }

  return true;
}
