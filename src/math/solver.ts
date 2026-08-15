/**
 * @file solver.ts
 * @description Mathematical raycasting and path obstruction solver for rope untangling.
 */

import { GridCoord, Rope, Vector2D } from '../types';

/**
 * Checks if a 2D coordinate is within the square grid bounds.
 * 
 * @param {GridCoord} coord - Target coordinate to evaluate.
 * @param {number} gridSize - Dimension of the square grid matrix.
 * @returns {boolean} True if coordinate is within [0, gridSize - 1] on both axes.
 * @description Evaluates mathematical bounding inequality: 0 <= x < N and 0 <= y < N.
 */
export function isWithinBounds(coord: GridCoord, gridSize: number): boolean {
  return coord.x >= 0 && coord.x < gridSize && coord.y >= 0 && coord.y < gridSize;
}

/**
 * Determines whether a given rope has an unobstructed exit trajectory out of the board.
 * 
 * @param {Rope} rope - The target rope being evaluated for exit.
 * @param {Rope[]} allActiveRopes - All ropes currently active on the board.
 * @param {number} gridSize - Dimension of the square board.
 * @returns {boolean} True if the rope's forward path to the perimeter is completely clear of other ropes.
 * @description Projects the rope's slither trajectory step-by-step from its knot along its exit direction.
 * Mathematically confirms that every intermediate coordinate before leaving the grid is either empty or belongs to this rope.
 */
export function canRopeExit(rope: Rope, allActiveRopes: Rope[], gridSize: number): boolean {
  const knot = rope.body[rope.knotIndex];
  const dir: Vector2D = rope.exitDirection;

  // Build coordinate lookup map for all OTHER ropes on the board
  const occupiedByOthers = new Set<string>();
  for (const other of allActiveRopes) {
    if (other.id === rope.id) continue;
    for (const pt of other.body) {
      occupiedByOthers.add(`${pt.x},${pt.y}`);
    }
  }

  // Raycast forward from knot along the exit direction until out of board bounds
  let curX = knot.x + dir.dx;
  let curY = knot.y + dir.dy;

  while (isWithinBounds({ x: curX, y: curY }, gridSize)) {
    if (occupiedByOthers.has(`${curX},${curY}`)) {
      return false; // Path is blocked by another rope
    }
    curX += dir.dx;
    curY += dir.dy;
  }

  return true; // Unobstructed path to board boundary
}

/**
 * Finds all ropes on the current board that can currently exit without collision.
 * 
 * @param {Rope[]} ropes - Array of all active ropes.
 * @param {number} gridSize - Square board dimension.
 * @returns {Rope[]} Array of unblocked ropes that can be successfully tapped.
 * @description Filters the active rope list using the mathematical exit projection formula.
 */
export function findSolvableRopes(ropes: Rope[], gridSize: number): Rope[] {
  return ropes.filter(r => canRopeExit(r, ropes, gridSize));
}

/**
 * Mathematically validates whether a complete board state is fully solvable from start to finish.
 * 
 * @param {Rope[]} initialRopes - Initial set of ropes on the board.
 * @param {number} gridSize - Square board dimension.
 * @returns {boolean} True if the entire board can be untangled to 0 remaining ropes.
 * @description Simulates sequential optimal untangling steps until all ropes are cleared or a deadlock occurs.
 */
export function isBoardFullySolvable(initialRopes: Rope[], gridSize: number): boolean {
  let active = [...initialRopes];
  
  while (active.length > 0) {
    const solvable = findSolvableRopes(active, gridSize);
    if (solvable.length === 0) {
      return false; // Deadlock: no rope can escape
    }
    // Remove the first unblocked rope and continue simulation
    const freedId = solvable[0].id;
    active = active.filter(r => r.id !== freedId);
  }

  return true;
}
