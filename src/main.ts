/**
 * @file main.ts
 * @author @me__unpredictable
 * @description Bootstrap and lifecycle initialization for Arrow Tap PixiJS application.
 */

import * as PIXI from 'pixi.js';
import { ArrowTapGame } from './game';

/**
 * Initializes and mounts the PixiJS application into the DOM.
 * 
 * @param {void} - No input parameters.
 * @returns {Promise<void>} Resolves when PixiJS engine and Arrow Tap game instance are mounted.
 * @description Creates fullscreen WebGL/WebGPU application canvas with auto-resizing.
 */
async function init(): Promise<void> {
  const app = new PIXI.Application();

  await app.init({
    resizeTo: window,
    backgroundColor: 0x0A0F1D,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true
  });

  const appElement = document.getElementById('app');
  if (appElement) {
    appElement.appendChild(app.canvas);
  } else {
    document.body.appendChild(app.canvas);
  }

  // Initialize Arrow Tap Game
  const game = new ArrowTapGame(app);
  (window as unknown as { __ARROW_TAP_GAME__: ArrowTapGame }).__ARROW_TAP_GAME__ = game;
}

window.addEventListener('DOMContentLoaded', () => {
  init().catch((err) => {
    console.error('Failed to initialize Arrow Tap engine:', err);
  });
});
