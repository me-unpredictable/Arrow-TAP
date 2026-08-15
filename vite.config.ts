/**
 * @file vite.config.ts
 * @author @me__unpredictable
 * @description Vite configuration for Arrow Tap with Cordova relative asset paths and www output directory.
 */

import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'www',
    emptyOutDir: true
  }
});
