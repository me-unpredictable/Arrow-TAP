/**
 * @file main.ts
 * @description Application bootstrap script that initializes PixiJS v8 and starts Arrow Tap.
 */

import * as PIXI from 'pixi.js';
import { ArrowTapGame } from './game';

/**
 * Bootstraps the PixiJS WebGL/WebGPU application and mounts the game controller.
 * 
 * @param {void} - No input parameters.
 * @returns {Promise<void>} Resolves when the engine is initialized.
 * @description Configures auto-resizing canvas, retina DPR clamping, mounts to DOM, and launches ArrowTapGame.
 */
async function bootstrap(): Promise<void> {
  const app = new PIXI.Application();

  await app.init({
    resizeTo: window,
    backgroundColor: 0x070a13,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true
  });

  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.appendChild(app.canvas);
  }

  // Instantiate Game Controller
  new ArrowTapGame(app);
}

window.addEventListener('DOMContentLoaded', () => {
  bootstrap().catch(err => {
    console.error('Failed to bootstrap Arrow Tap:', err);
  });
});
