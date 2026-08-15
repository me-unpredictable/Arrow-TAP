/**
 * @file startButton.ts
 * @author @me__unpredictable
 * @description Start button component with randomized comedic exit animations guaranteed <= 0.15s (150ms).
 */

import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { StartAnimationType } from '../types';

const ANIMATION_TYPES: StartAnimationType[] = ['meltdown', 'rocket', 'squish', 'vaporize'];

/**
 * Creates an interactive Start Game button with high-energy arcade styling and funny rapid exit animations.
 * 
 * @param {() => void} onStartCallback - Callback triggered upon completion of the start animation.
 * @param {() => void} onPlayTap - Callback to trigger sound effect immediately on tap.
 * @returns {PIXI.Container} The constructed Start Button display container.
 * @description Builds a pill-shaped glowing interactive button with pointer events and funny <= 0.15s exit animations.
 */
export function createStartButton(
  onStartCallback: () => void,
  onPlayTap: () => void
): PIXI.Container {
  const container = new PIXI.Container();
  container.eventMode = 'static';
  container.cursor = 'pointer';

  // Background Graphics
  const bg = new PIXI.Graphics();
  const width = 240;
  const height = 64;
  const radius = 32;

  /**
   * Draws the start button rounded pill background.
   * 
   * @param {number} fillColor - Primary fill color.
   * @param {number} strokeColor - Border outline color.
   * @returns {void}
   * @description Clears and redraws the rounded rectangle button geometry.
   */
  function drawButton(fillColor = 0x00FF66, strokeColor = 0xFFFFFF): void {
    bg.clear();
    bg.roundRect(-width / 2, -height / 2, width, height, radius);
    bg.fill({ color: fillColor });
    bg.stroke({ color: strokeColor, width: 4 });
  }

  drawButton();
  container.addChild(bg);

  // Label text
  const label = new PIXI.Text({
    text: '🚀 START GAME',
    style: {
      fontFamily: 'Segoe UI, Impact, sans-serif',
      fontSize: 24,
      fontWeight: 'bold',
      fill: 0x000000,
      letterSpacing: 1
    }
  });
  label.anchor.set(0.5);
  container.addChild(label);

  // Subtle pulsing idle animation
  const pulseTween = gsap.to(container.scale, {
    x: 1.05,
    y: 1.05,
    duration: 0.6,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  let isTriggered = false;

  /**
   * Executes a randomized funny exit animation that finishes in <= 0.15 seconds.
   * 
   * @param {void} - No input parameters.
   * @returns {void}
   * @description Selects a random comedic animation (meltdown, rocket, squish, vaporize) and triggers start callback.
   */
  function executeFunnyExit(): void {
    if (isTriggered) return;
    isTriggered = true;
    pulseTween.kill();
    onPlayTap();

    const animType = ANIMATION_TYPES[Math.floor(Math.random() * ANIMATION_TYPES.length)];
    const duration = 0.14; // Strictly <= 0.15s (140ms)

    switch (animType) {
      case 'meltdown':
        // Melts down vertically with a liquid stretch
        gsap.to(container.scale, {
          x: 1.8,
          y: 0.05,
          duration: duration,
          ease: 'power4.in',
          onComplete: () => onStartCallback()
        });
        gsap.to(container, {
          y: container.y + 40,
          alpha: 0,
          duration: duration
        });
        break;

      case 'rocket':
        // Rockets upwards at supersonic speed
        gsap.to(container, {
          y: container.y - 450,
          rotation: -0.3,
          duration: duration,
          ease: 'power3.in',
          onComplete: () => onStartCallback()
        });
        gsap.to(container.scale, {
          x: 0.4,
          y: 2.0,
          duration: duration
        });
        break;

      case 'squish':
        // Squishes flat then pops into zero
        gsap.timeline({ onComplete: () => onStartCallback() })
          .to(container.scale, { x: 1.6, y: 0.2, duration: 0.06, ease: 'power2.in' })
          .to(container.scale, { x: 0, y: 0, alpha: 0, duration: 0.08, ease: 'back.in(3)' });
        break;

      case 'vaporize':
      default:
        // Explodes outward into invisibility
        gsap.to(container.scale, {
          x: 2.2,
          y: 2.2,
          duration: duration,
          ease: 'power2.out',
          onComplete: () => onStartCallback()
        });
        gsap.to(container, {
          alpha: 0,
          rotation: (Math.random() - 0.5) * 1.5,
          duration: duration
        });
        break;
    }
  }

  container.on('pointerdown', executeFunnyExit);

  return container;
}
