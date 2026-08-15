/**
 * @file hud.ts
 * @description Ultra-compact HUD maximizing board gameplay area with slim top status pill and bottom lives.
 */

import * as PIXI from 'pixi.js';
import gsap from 'gsap';

export interface HudController {
  container: PIXI.Container;
  updateLevel: (level: number) => void;
  updateScore: (score: number) => void;
  updateProgress: (progressFraction: number) => void;
  updateShuffleCounter: (remainingTaps: number) => void;
  updateLives: (lives: number) => void;
  resize: (width: number, height: number, boardSize: number, boardY: number) => void;
}

/**
 * Creates the ultra-compact HUD.
 * 
 * @param {void} - No input parameters.
 * @returns {HudController} Controller with update and resize handlers.
 * @description Builds slim header and footer UI taking minimal screen padding.
 */
export function createHud(): HudController {
  const container = new PIXI.Container();

  // TOP BAR
  const topBar = new PIXI.Container();
  container.addChild(topBar);

  const levelText = new PIXI.Text({
    text: 'LEVEL 1',
    style: {
      fontFamily: 'Segoe UI, Impact, sans-serif',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0x00F0FF,
      stroke: { color: 0x000000, width: 2.5 }
    }
  });
  levelText.anchor.set(0, 0.5);
  topBar.addChild(levelText);

  const scoreText = new PIXI.Text({
    text: 'SCORE: 0',
    style: {
      fontFamily: 'Segoe UI, Impact, sans-serif',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xFFE600,
      stroke: { color: 0x000000, width: 2.5 }
    }
  });
  scoreText.anchor.set(1, 0.5);
  topBar.addChild(scoreText);

  const shuffleText = new PIXI.Text({
    text: '⚡ SHUFFLE: 3',
    style: {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: 12,
      fontWeight: 'bold',
      fill: 0xFF9900
    }
  });
  shuffleText.anchor.set(0.5, 0.5);
  topBar.addChild(shuffleText);

  const progressBarBg = new PIXI.Graphics();
  const progressBarFill = new PIXI.Graphics();
  topBar.addChild(progressBarBg);
  topBar.addChild(progressBarFill);

  let currentBarWidth = 260;
  const barHeight = 4;

  // BOTTOM BAR
  const bottomBar = new PIXI.Container();
  container.addChild(bottomBar);

  const livesIcons: PIXI.Text[] = [];
  const totalLives = 3;

  for (let i = 0; i < totalLives; i++) {
    const heart = new PIXI.Text({
      text: '💖',
      style: { fontSize: 20 }
    });
    heart.anchor.set(0.5);
    bottomBar.addChild(heart);
    livesIcons.push(heart);
  }

  function drawProgressBar(fraction: number): void {
    progressBarBg.clear();
    progressBarBg.roundRect(-currentBarWidth / 2, -barHeight / 2, currentBarWidth, barHeight, 2);
    progressBarBg.fill({ color: 0x1F293D });

    progressBarFill.clear();
    const fillW = Math.max(0, Math.min(currentBarWidth, currentBarWidth * fraction));
    if (fillW > 0) {
      progressBarFill.roundRect(-currentBarWidth / 2, -barHeight / 2, fillW, barHeight, 2);
      progressBarFill.fill({ color: 0x00FF66 });
    }
  }

  drawProgressBar(0);

  return {
    container,

    updateLevel: (level: number) => {
      levelText.text = `LEVEL ${level}`;
      gsap.fromTo(levelText.scale, { x: 1.25, y: 1.25 }, { x: 1, y: 1, duration: 0.25, ease: 'back.out(2)' });
    },

    updateScore: (score: number) => {
      scoreText.text = `SCORE: ${score}`;
      gsap.fromTo(scoreText.scale, { x: 1.25, y: 1.25 }, { x: 1, y: 1, duration: 0.2, ease: 'back.out(2)' });
    },

    updateProgress: (progressFraction: number) => {
      drawProgressBar(progressFraction);
    },

    updateShuffleCounter: (remainingTaps: number) => {
      shuffleText.text = remainingTaps === 0 ? '⚡ SHUFFLING!' : `⚡ SHUFFLE: ${remainingTaps}`;
      gsap.fromTo(shuffleText.scale, { x: 1.2, y: 1.2 }, { x: 1, y: 1, duration: 0.2, ease: 'power2.out' });
    },

    updateLives: (lives: number) => {
      for (let i = 0; i < totalLives; i++) {
        if (i < lives) {
          livesIcons[i].text = '💖';
          livesIcons[i].alpha = 1;
        } else {
          if (livesIcons[i].text !== '💔') {
            livesIcons[i].text = '💔';
            gsap.to(livesIcons[i].scale, { x: 1.4, y: 1.4, duration: 0.15, yoyo: true, repeat: 1 });
            gsap.to(livesIcons[i], { alpha: 0.45, duration: 0.3 });
          }
        }
      }
    },

    resize: (width: number, height: number) => {
      // Ultra-compact top bar (takes only top 16px)
      topBar.x = width / 2;
      topBar.y = 18;

      currentBarWidth = Math.min(width * 0.9, 320);
      levelText.x = -currentBarWidth / 2;
      levelText.y = -10;
      scoreText.x = currentBarWidth / 2;
      scoreText.y = -10;
      shuffleText.x = 0;
      shuffleText.y = -10;

      progressBarBg.y = 10;
      progressBarFill.y = 10;

      // Ultra-compact bottom bar (takes only bottom 20px)
      bottomBar.x = width / 2;
      bottomBar.y = height - 16;

      const spacing = 32;
      livesIcons.forEach((icon, idx) => {
        icon.x = (idx - 1) * spacing;
        icon.y = 0;
      });
    }
  };
}
