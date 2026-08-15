/**
 * @file types.ts
 * @description Core TypeScript type definitions and interfaces for Arrow Tap.
 */

/**
 * 2D Grid Coordinate representing integer positions on the board matrix.
 */
export interface GridCoord {
  x: number;
  y: number;
}

/**
 * 2D Vector representation for directional offsets.
 */
export interface Vector2D {
  dx: number;
  dy: number;
}

/**
 * Representation of an individual rope in the puzzle maze.
 */
export interface Rope {
  id: number;
  color: number;
  body: GridCoord[]; // Ordered list of grid coordinates from Tail (knot) to Head (arrow)
  exitDirection: Vector2D; // Direction the head arrow is facing
}

/**
 * Generated Level Structure.
 */
export interface LevelData {
  ropes: Rope[];
  gridSize: number;
  shapeName: string;
  validCells: Set<string>;
}

/**
 * Game state snapshot.
 */
export interface GameState {
  level: number;
  score: number;
  lives: number;
  shufflesRemainingInStreak: number;
  ropes: Rope[];
  gridSize: number;
  shapeName: string;
  validCells: Set<string>;
  isPlaying: boolean;
  isGameOver: boolean;
}

/**
 * Animation style types for start button exit.
 */
export type StartAnimationType = 'meltdown' | 'rocket' | 'squish' | 'vaporize';

/**
 * Procedural Techno Music Track Control Interface.
 */
export interface TechnoAudioController {
  start: () => void;
  stop: () => void;
  setBpm: (bpm: number) => void;
  playTapSound: () => void;
  playSuccessSound: () => void;
  playErrorSound: () => void;
  playShuffleSound: () => void;
  playFanfareSound: () => void;
  playCountdownBeep: (stepNum: number) => void; // 3, 2, 1, 0 (GO)
}
