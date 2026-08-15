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
  body: GridCoord[];
  knotIndex: number; // Index in body where the interactive knot is located (0 or body.length - 1)
  exitDirection: Vector2D; // Mathematical unit direction vector pointing towards exit
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
}
