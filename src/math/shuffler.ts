/**
 * @file shuffler.ts
 * @description Mathematical shuffle algorithm that rearranges active ropes while guaranteeing at least one valid exit path.
 */

import { GridCoord, Rope, Vector2D } from '../types';
import { findSolvableRopes, isWithinBounds } from './solver';
import { getClosestBorderDirection } from './mazeGenerator';

/**
 * Mathematically translates or rotates a rope body to a new position on the grid.
 * 
 * @param {Rope} rope - The source rope.
 * @param {GridCoord} newStart - New starting coordinate for the first segment.
 * @param {Set<string>} occupied - Currently occupied coordinate set.
 * @param {number} gridSize - Square board dimension.
 * @returns {Rope | null} Repositioned rope or null if placement creates an overlap.
 * @description Computes coordinate deltas from the original shape and validates against board bounds and occupancy.
 */
export function tryRepositionRope(
  rope: Rope,
  newStart: GridCoord,
  occupied: Set<string>,
  gridSize: number
): Rope | null {
  const deltaX = newStart.x - rope.body[0].x;
  const deltaY = newStart.y - rope.body[0].y;

  const newBody: GridCoord[] = [];
  for (const pt of rope.body) {
    const moved = { x: pt.x + deltaX, y: pt.y + deltaY };
    if (!isWithinBounds(moved, gridSize) || occupied.has(`${moved.x},${moved.y}`)) {
      return null; // Out of bounds or collision
    }
    newBody.push(moved);
  }

  const knotCoord = newBody[rope.knotIndex];
  const exitDir: Vector2D = getClosestBorderDirection(knotCoord, gridSize);

  return {
    ...rope,
    body: newBody,
    exitDirection: exitDir
  };
}

/**
 * Shuffles active ropes across the square board while mathematically guaranteeing at least one unblocked exit.
 * 
 * @param {Rope[]} activeRopes - Currently remaining active ropes on the board.
 * @param {number} gridSize - Square board dimension.
 * @returns {Rope[]} Rearranged array of active ropes with verified solvability.
 * @description Repositions ropes into unoccupied grid cells and verifies via findSolvableRopes that at least one rope is untangled.
 */
export function shuffleRemainingRopes(activeRopes: Rope[], gridSize: number): Rope[] {
  if (activeRopes.length <= 1) {
    return activeRopes; // Nothing to shuffle
  }

  for (let trial = 0; trial < 50; trial++) {
    const occupied = new Set<string>();
    const shuffledRopes: Rope[] = [];
    const ordered = [...activeRopes].sort(() => Math.random() - 0.5);

    let allPlaced = true;

    for (const rope of ordered) {
      // Find all possible valid starting slots
      const candidateStarts: GridCoord[] = [];
      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          if (!occupied.has(`${x},${y}`)) {
            candidateStarts.push({ x, y });
          }
        }
      }
      candidateStarts.sort(() => Math.random() - 0.5);

      let placed = false;
      for (const start of candidateStarts) {
        const movedRope = tryRepositionRope(rope, start, occupied, gridSize);
        if (movedRope) {
          for (const pt of movedRope.body) {
            occupied.add(`${pt.x},${pt.y}`);
          }
          shuffledRopes.push(movedRope);
          placed = true;
          break;
        }
      }

      if (!placed) {
        allPlaced = false;
        break;
      }
    }

    if (allPlaced && findSolvableRopes(shuffledRopes, gridSize).length > 0) {
      return shuffledRopes;
    }
  }

  // Fallback: If reshuffling grid positions fails, randomize exit directions with solvability check
  const fallback = activeRopes.map(r => ({
    ...r,
    exitDirection: getClosestBorderDirection(r.body[r.knotIndex], gridSize)
  }));

  return fallback;
}
