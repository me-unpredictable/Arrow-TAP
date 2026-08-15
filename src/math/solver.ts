/**
 * @file solver.ts
 * @description Mathematical raycasting, path obstruction solver, and strict zero-deadlock verification proofs.
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
  gridSize: number
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

  // Raycast forward from head along exitDirection until leaving outer board boundary
  let curX = head.x + dir.dx;
  let curY = head.y + dir.dy;

  while (curX >= 0 && curX < gridSize && curY >= 0 && curY < gridSize) {
    if (occupiedByOthers.has(`${curX},${curY}`)) {
      return false; // Path is blocked by another rope
    }
    curX += dir.dx;
    curY += dir.dy;
  }

  return true; // Unobstructed straight-line escape path out of the board
}

/**
 * Finds all ropes on the current board that can currently exit without collision.
 * 
 * @param {Rope[]} ropes - Array of all active ropes.
 * @param {number} gridSize - Square board dimension.
 * @returns {Rope[]} Array of unblocked ropes.
 * @description Filters active ropes using the mathematical raycast exit formula.
 */
export function findSolvableRopes(
  ropes: Rope[],
  gridSize: number
): Rope[] {
  return ropes.filter(r => canRopeExit(r, ropes, gridSize));
}

/**
 * Mathematically verifies that a board configuration has ZERO deadlocks from start to finish.
 * Returns the exact sequential topological untangling order.
 * 
 * @param {Rope[]} initialRopes - Array of all ropes on the board.
 * @param {number} gridSize - Dimension of the square grid.
 * @returns {{ isSolvable: boolean; escapeSequence: number[] }} Object containing boolean solvability and the exact resolution sequence of rope IDs.
 * @description Executes deterministic full-state elimination simulation to prove absence of deadlock cycles.
 */
export function verifyNoDeadlock(
  initialRopes: Rope[],
  gridSize: number
): { isSolvable: boolean; escapeSequence: number[] } {
  let active = [...initialRopes];
  const escapeSequence: number[] = [];

  while (active.length > 0) {
    const solvable = findSolvableRopes(active, gridSize);
    if (solvable.length === 0) {
      // Deadlock detected: no active rope has an open exit
      return { isSolvable: false, escapeSequence: [] };
    }
    // Pick the first solvable rope, register its escape, and continue simulation
    const nextFreeRope = solvable[0];
    escapeSequence.push(nextFreeRope.id);
    active = active.filter(r => r.id !== nextFreeRope.id);
  }

  return { isSolvable: true, escapeSequence };
}

/**
 * Helper predicate checking if an entire board state is fully solvable with zero deadlocks.
 * 
 * @param {Rope[]} initialRopes - Initial ropes.
 * @param {number} gridSize - Grid dimension.
 * @returns {boolean} True if board can be 100% untangled without any deadlocks.
 * @description Invokes verifyNoDeadlock and returns boolean flag.
 */
export function isBoardFullySolvable(
  initialRopes: Rope[],
  gridSize: number
): boolean {
  return verifyNoDeadlock(initialRopes, gridSize).isSolvable;
}
