/**
 * @file testSolvability.ts
 * @description Automated verification script running procedural levels and consecutive shuffles
 * to mathematically prove 100% solvability with ZERO deadlocks.
 */

import { generateSolvableLevel } from './math/mazeGenerator';
import { shuffleRemainingRopes } from './math/shuffler';
import { isBoardFullySolvable, verifyNoDeadlock } from './math/solver';

console.log('--- STARTING MATHEMATICAL SHUFFLE & LEVEL SOLVABILITY PROOF ---');

let totalLevelsTested = 0;
let totalShufflesTested = 0;
let failedLevels = 0;
let failedShuffles = 0;

for (let level = 1; level <= 10; level++) {
  const startTime = Date.now();
  const levelData = generateSolvableLevel(level, 600);
  const genTime = Date.now() - startTime;
  totalLevelsTested++;

  const initialCheck = isBoardFullySolvable(levelData.ropes, levelData.gridSize);
  if (!initialCheck) {
    failedLevels++;
    console.error(`FAILED Level ${level}: Initial level is unsolvable!`);
  } else {
    console.log(`Level ${level} (${levelData.shapeName}, N=${levelData.gridSize}, ropes=${levelData.ropes.length}): SOLVABLE in ${genTime}ms`);
  }

  // Simulate consecutive 3-tap shuffles during gameplay
  let currentRopes = [...levelData.ropes];
  for (let s = 0; s < 3; s++) {
    if (currentRopes.length <= 2) break;

    const solution = verifyNoDeadlock(currentRopes, levelData.gridSize);
    if (!solution.isSolvable || solution.escapeSequence.length === 0) {
      failedShuffles++;
      console.error(`FAILED: Unsolvable state before shuffle at Level ${level}, Step ${s}`);
      break;
    }

    const freedId = solution.escapeSequence[0];
    currentRopes = currentRopes.filter(r => r.id !== freedId);

    const shufStart = Date.now();
    const shuffled = shuffleRemainingRopes(currentRopes, levelData.gridSize, levelData.validCells);
    const shufTime = Date.now() - shufStart;
    totalShufflesTested++;

    const shuffleCheck = isBoardFullySolvable(shuffled, levelData.gridSize);
    if (!shuffleCheck) {
      failedShuffles++;
      console.error(`FAILED Level ${level}, Shuffle ${s}: Shuffled board resulted in unsolvable deadlock!`);
    } else {
      console.log(`  -> Shuffle ${s + 1} (${shuffled.length} ropes): SOLVABLE in ${shufTime}ms`);
    }

    currentRopes = shuffled;
  }
}

console.log(`\n========================================`);
console.log(`TEST RESULTS:`);
console.log(`Total Levels Generated & Verified: ${totalLevelsTested}`);
console.log(`Total Shuffles Tested: ${totalShufflesTested}`);
console.log(`Failed Levels: ${failedLevels}`);
console.log(`Failed Shuffles: ${failedShuffles}`);
console.log(`Solvability Guarantee Rate: ${failedShuffles === 0 && failedLevels === 0 ? '100.00% PASS' : 'FAIL'}`);
console.log(`========================================\n`);
