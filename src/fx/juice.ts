/**
 * @file juice.ts
 * @author @me__unpredictable
 * @description High-impact visual juice, emoji flooding particle systems, floating bouncing text, and screen shake mechanics.
 */

import * as PIXI from 'pixi.js';
import gsap from 'gsap';

// Array of celebratory emojis for flood effects
const CELEBRATION_EMOJIS = ['🎉', '⚡', '⭐', '🔥', '🚀', '✨', '🎈', '💎', '🌈', '🎯', '💥'];

/**
 * Triggers a fast damped screen shake on the target container.
 * 
 * @param {PIXI.Container} container - The root PixiJS display container.
 * @param {number} intensity - Shake magnitude in pixels (default: 12).
 * @param {number} duration - Shake duration in seconds (default: 0.25).
 * @returns {void}
 * @description Applies decaying sinusoidal positional offsets along X and Y axes using GSAP.
 */
export function triggerScreenShake(container: PIXI.Container, intensity = 12, duration = 0.25): void {
  const originalX = container.x;
  const originalY = container.y;

  gsap.to(container, {
    duration: 0.04,
    repeat: Math.floor(duration / 0.04),
    yoyo: true,
    x: `+=${Math.random() * intensity - intensity / 2}`,
    y: `+=${Math.random() * intensity - intensity / 2}`,
    ease: 'power1.inOut',
    onComplete: () => {
      container.x = originalX;
      container.y = originalY;
    }
  });
}

/**
 * Spawns a floating bouncy animated milestone text that flies upwards and fades.
 * 
 * @param {PIXI.Container} parent - Display container to mount the text onto.
 * @param {string} text - Message string to display (e.g. "+1 POINT", "SHUFFLE!").
 * @param {number} x - Target center X coordinate.
 * @param {number} y - Target center Y coordinate.
 * @param {number} color - Hexadecimal color code.
 * @returns {void}
 * @description Creates an emphatic PixiJS Text instance with elastic scale-up and floating fade-out.
 */
export function spawnFloatingText(
  parent: PIXI.Container,
  text: string,
  x: number,
  y: number,
  color = 0xFFE600
): void {
  const txt = new PIXI.Text({
    text,
    style: {
      fontFamily: 'Segoe UI, Impact, sans-serif',
      fontSize: 28,
      fontWeight: 'bold',
      fill: color,
      stroke: { color: 0x000000, width: 4 },
      dropShadow: {
        color: 0x000000,
        blur: 4,
        distance: 2
      }
    }
  });

  txt.anchor.set(0.5);
  txt.x = x;
  txt.y = y;
  txt.scale.set(0.2);
  parent.addChild(txt);

  gsap.timeline()
    .to(txt.scale, { x: 1.2, y: 1.2, duration: 0.15, ease: 'back.out(2)' })
    .to(txt, { y: y - 50, alpha: 0, duration: 0.5, ease: 'power2.in', onComplete: () => {
      parent.removeChild(txt);
      txt.destroy();
    }});
}

/**
 * Floods the screen with an explosive cascade of celebratory emojis and spark particles.
 * 
 * @param {PIXI.Container} parent - Display container for particles.
 * @param {number} x - Origin center X coordinate.
 * @param {number} y - Origin center Y coordinate.
 * @param {number} count - Quantity of emojis to spawn (default: 25).
 * @returns {void}
 * @description Emits multi-directional physics particles with random velocities, rotations, and fades.
 */
export function floodEmojis(
  parent: PIXI.Container,
  x: number,
  y: number,
  count = 25
): void {
  for (let i = 0; i < count; i++) {
    const emojiChar = CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)];
    const emoji = new PIXI.Text({
      text: emojiChar,
      style: { fontSize: 24 + Math.random() * 16 }
    });

    emoji.anchor.set(0.5);
    emoji.x = x + (Math.random() * 20 - 10);
    emoji.y = y + (Math.random() * 20 - 10);
    emoji.scale.set(0.5);
    parent.addChild(emoji);

    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 220;
    const destX = emoji.x + Math.cos(angle) * distance;
    const destY = emoji.y + Math.sin(angle) * distance;
    const duration = 0.5 + Math.random() * 0.4;

    gsap.timeline()
      .to(emoji.scale, { x: 1.3, y: 1.3, duration: 0.15, ease: 'power2.out' })
      .to(emoji, {
        x: destX,
        y: destY + 40, // gravity arc
        rotation: (Math.random() - 0.5) * 6,
        alpha: 0,
        duration: duration,
        ease: 'power3.out',
        onComplete: () => {
          parent.removeChild(emoji);
          emoji.destroy();
        }
      });
  }
}
