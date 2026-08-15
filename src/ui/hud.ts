/**
 * @file hud.ts
 * @description Heads-Up Display (HUD) displaying dynamic Top Bar (Level, Score, Progress) and Bottom Bar (3 Lives).
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
 * Creates the dynamic HUD containing Top Bar and Bottom Bar.
 * 
 * @param {void} - No input parameters.
 * @returns {HudController} Controller object with reactive update methods and resize handler.
 * @description Constructs top level badges, live-animated progress bar, score counter, and 3-heart lives indicator.
 */
export function createHud(): HudController {
  const container = new PIXI.Container();

  // TOP BAR ELEMENTS
  const topBar = new PIXI.Container();
  container.addChild(topBar);

  // Level Badge
  const levelText = new PIXI.Text({
    text: 'LEVEL 1',
    style: {
      fontFamily: 'Segoe UI, Impact, sans-serif',
      fontSize: 22,
      fontWeight: 'bold',
      fill: 0x00F0FF,
      stroke: { color: 0x000000, width: 3 }
    }
  });
  levelText.anchor.set(0, 0.5);
  topBar.addChild(levelText);

  // Score Badge
  const scoreText = new PIXI.Text({
    text: 'SCORE: 0',
    style: {
      fontFamily: 'Segoe UI, Impact, sans-serif',
      fontSize: 22,
      fontWeight: 'bold',
      fill: 0xFFE600,
      stroke: { color: 0x000000, width: 3 }
    }
  });
  scoreText.anchor.set(1, 0.5);
  topBar.addChild(scoreText);

  // Shuffle Countdown Badge
  const shuffleText = new PIXI.Text({
    text: '⚡ SHUFFLE IN: 3',
    style: {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: 14,
      fontWeight: 'bold',
      fill: 0xFF9900
    }
  });
  shuffleText.anchor.set(0.5, 0.5);
  topBar.addChild(shuffleText);

  // Dynamic Level Progress Bar
  const progressBarBg = new PIXI.Graphics();
  const progressBarFill = new PIXI.Graphics();
  topBar.addChild(progressBarBg);
  topBar.addChild(progressBarFill);

  let currentBarWidth = 280;
  const barHeight = 8;

  // BOTTOM BAR ELEMENTS (LIVES)
  const bottomBar = new PIXI.Container();
  container.addChild(bottomBar);

  const livesIcons: PIXI.Text[] = [];
  const totalLives = 3;

  for (let i = 0; i < totalLives; i++) {
    const heart = new PIXI.Text({
      text: '💖',
      style: { fontSize: 32 }
    });
    heart.anchor.set(0.5);
    bottomBar.addChild(heart);
    livesIcons.push(heart);
  }

  const livesLabel = new PIXI.Text({
    text: 'LIVES',
    style: {
      fontFamily: 'Segoe UI, Impact, sans-serif',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xAAAAAA
    }
  });
  livesLabel.anchor.set(0.5);
  bottomBar.addChild(livesLabel);

  /**
   * Redraws the dynamic progress bar graphic.
   * 
   * @param {number} fraction - Progress normalized between 0.0 and 1.0.
   * @returns {void}
   * @description Clears and redraws background track and filled progress indicator.
   */
  function drawProgressBar(fraction: number): void {
    progressBarBg.clear();
    progressBarBg.roundRect(-currentBarWidth / 2, -barHeight / 2, currentBarWidth, barHeight, 4);
    progressBarBg.fill({ color: 0x1F293D });

    progressBarFill.clear();
    const fillW = Math.max(0, Math.min(currentBarWidth, currentBarWidth * fraction));
    if (fillW > 0) {
      progressBarFill.roundRect(-currentBarWidth / 2, -barHeight / 2, fillW, barHeight, 4);
      progressBarFill.fill({ color: 0x00FF66 });
    }
  }

  drawProgressBar(0);

  return {
    container,

    /**
     * Updates the level display with a scale pop.
     * 
     * @param {number} level - Current level.
     * @returns {void}
     * @description Sets level text and triggers an attention-grabbing pop tween.
     */
    updateLevel: (level: number) => {
      levelText.text = `LEVEL ${level}`;
      gsap.fromTo(levelText.scale, { x: 1.4, y: 1.4 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(2)' });
    },

    /**
     * Updates the player score with celebratory pop.
     * 
     * @param {number} score - Current score.
     * @returns {void}
     * @description Updates score string and triggers elastic animation.
     */
    updateScore: (score: number) => {
      scoreText.text = `SCORE: ${score}`;
      gsap.fromTo(scoreText.scale, { x: 1.3, y: 1.3 }, { x: 1, y: 1, duration: 0.2, ease: 'back.out(2)' });
    },

    /**
     * Animates the level progress bar fill.
     * 
     * @param {number} progressFraction - Fraction complete (0.0 to 1.0).
     * @returns {void}
     * @description Re-renders the progress bar fill geometry.
     */
    updateProgress: (progressFraction: number) => {
      drawProgressBar(progressFraction);
    },

    /**
     * Updates the shuffle countdown notification pill.
     * 
     * @param {number} remainingTaps - Number of taps remaining before shuffle.
     * @returns {void}
     * @description Updates shuffle text counter with pulse effect.
     */
    updateShuffleCounter: (remainingTaps: number) => {
      shuffleText.text = remainingTaps === 0 ? '⚡ SHUFFLING!' : `⚡ SHUFFLE IN: ${remainingTaps}`;
      gsap.fromTo(shuffleText.scale, { x: 1.2, y: 1.2 }, { x: 1, y: 1, duration: 0.2, ease: 'power2.out' });
    },

    /**
     * Updates remaining hearts with fracture/loss animation on decrement.
     * 
     * @param {number} lives - Current lives (0 to 3).
     * @returns {void}
     * @description Swaps heart emojis and applies wobble animations to lost lives.
     */
    updateLives: (lives: number) => {
      for (let i = 0; i < totalLives; i++) {
        if (i < lives) {
          livesIcons[i].text = '💖';
          livesIcons[i].alpha = 1;
        } else {
          if (livesIcons[i].text !== '💔') {
            livesIcons[i].text = '💔';
            gsap.to(livesIcons[i].scale, { x: 1.5, y: 1.5, duration: 0.15, yoyo: true, repeat: 1 });
            gsap.to(livesIcons[i], { alpha: 0.5, duration: 0.3 });
          }
        }
      }
    },

    /**
     * Resizes and positions HUD elements adaptively to the viewport and square board bounds.
     * 
     * @param {number} width - Viewport width in pixels.
     * @param {number} height - Viewport height in pixels.
     * @param {number} boardSize - Square board size.
     * @param {number} boardY - Center Y of the square board.
     * @returns {void}
     * @description Recalculates anchor points and layout spacing for top and bottom HUD regions.
     */
    resize: (width: number, height: number, boardSize: number, boardY: number) => {
      const topSafeY = Math.max(25, (boardY - boardSize / 2) / 2);
      topBar.x = width / 2;
      topBar.y = topSafeY;

      currentBarWidth = Math.min(width * 0.85, 360);
      levelText.x = -currentBarWidth / 2;
      levelText.y = -18;
      scoreText.x = currentBarWidth / 2;
      scoreText.y = -18;
      shuffleText.x = 0;
      shuffleText.y = -18;

      progressBarBg.y = 12;
      progressBarFill.y = 12;

      // Bottom Bar Position
      const bottomSafeY = Math.min(height - 40, (boardY + boardSize / 2 + height) / 2);
      bottomBar.x = width / 2;
      bottomBar.y = bottomSafeY;

      livesLabel.y = -26;
      const spacing = 44;
      livesIcons.forEach((icon, idx) => {
        icon.x = (idx - 1) * spacing;
        icon.y = 8;
      });
    }
  };
}
