/**
 * @file game.ts
 * @description Main game controller handling silhouette maze shapes, untangling logic, snake slithering, and 3-tap shuffle loops.
 */

import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { GameState, Rope } from './types';
import { createTechnoAudioEngine } from './audio/technoSynth';
import { generateSolvableLevel } from './math/mazeGenerator';
import { canRopeExit } from './math/solver';
import { shuffleRemainingRopes } from './math/shuffler';
import { createHud, HudController } from './ui/hud';
import { createStartButton } from './ui/startButton';
import { createRopeGraphic, RopeGraphicHandle } from './rendering/ropeRenderer';
import { floodEmojis, spawnFloatingText, triggerScreenShake } from './fx/juice';

export class ArrowTapGame {
  private app: PIXI.Application;
  private audio = createTechnoAudioEngine();
  private hud: HudController;

  private rootContainer = new PIXI.Container();
  private boardContainer = new PIXI.Container();
  private boardBg = new PIXI.Graphics();
  private ropesContainer = new PIXI.Container();
  private fxContainer = new PIXI.Container();
  private uiContainer = new PIXI.Container();

  private state: GameState = {
    level: 1,
    score: 0,
    lives: 3,
    shufflesRemainingInStreak: 3,
    ropes: [],
    gridSize: 10,
    shape: 'apple',
    validCells: new Set(),
    isPlaying: false,
    isGameOver: false
  };

  private activeRopeHandles: Map<number, RopeGraphicHandle> = new Map();
  private totalRopesInCurrentLevel = 0;
  private startButtonContainer: PIXI.Container | null = null;
  private titleContainer: PIXI.Container | null = null;

  private boardOriginX = 0;
  private boardOriginY = 0;
  private boardPixelSize = 0;
  private cellSize = 0;

  /**
   * Initializes the game engine on the given PixiJS Application.
   * 
   * @param {PIXI.Application} app - Root PixiJS Application instance.
   * @returns {ArrowTapGame} Initialized game controller instance.
   * @description Constructs scene hierarchy, initializes procedural audio, and prepares home screen.
   */
  constructor(app: PIXI.Application) {
    this.app = app;
    this.app.stage.addChild(this.rootContainer);

    this.rootContainer.addChild(this.boardContainer);
    this.boardContainer.addChild(this.boardBg);
    this.boardContainer.addChild(this.ropesContainer);

    this.hud = createHud();
    this.rootContainer.addChild(this.hud.container);
    this.rootContainer.addChild(this.fxContainer);
    this.rootContainer.addChild(this.uiContainer);

    this.setupHomeScreen();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Mounts the Home Screen with title graphics and the rapid-exit start button.
   * 
   * @param {void} - No input parameters.
   * @returns {void}
   * @description Creates the game title banner and attaches the funny animated start button.
   */
  private setupHomeScreen(): void {
    this.uiContainer.removeChildren();
    this.hud.container.visible = false;
    this.boardContainer.visible = false;

    this.titleContainer = new PIXI.Container();

    const titleText = new PIXI.Text({
      text: '🏹 ARROW TAP',
      style: {
        fontFamily: 'Segoe UI, Impact, sans-serif',
        fontSize: 38,
        fontWeight: 'bold',
        fill: 0x00F0FF,
        stroke: { color: 0x000000, width: 6 },
        dropShadow: { color: 0x00F0FF, blur: 8, distance: 0 }
      }
    });
    titleText.anchor.set(0.5);
    titleText.y = -40;
    this.titleContainer.addChild(titleText);

    const subTitle = new PIXI.Text({
      text: 'THE GREAT ROPE UNTANGLE',
      style: {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: 16,
        fontWeight: 'bold',
        fill: 0xFFE600,
        letterSpacing: 2
      }
    });
    subTitle.anchor.set(0.5);
    subTitle.y = 0;
    this.titleContainer.addChild(subTitle);

    this.uiContainer.addChild(this.titleContainer);

    // Create Funny Start Button
    this.startButtonContainer = createStartButton(
      () => this.startNewGame(),
      () => this.audio.playTapSound()
    );
    this.uiContainer.addChild(this.startButtonContainer);

    this.updateHomeScreenPositions();
  }

  /**
   * Adjusts the position of the home screen elements when the screen resizes.
   * 
   * @param {void} - No input parameters.
   * @returns {void}
   * @description Centers title and start button based on canvas dimensions.
   */
  private updateHomeScreenPositions(): void {
    const cx = this.app.screen.width / 2;
    const cy = this.app.screen.height / 2;

    if (this.titleContainer) {
      this.titleContainer.x = cx;
      this.titleContainer.y = cy - 80;
    }

    if (this.startButtonContainer) {
      this.startButtonContainer.x = cx;
      this.startButtonContainer.y = cy + 70;
    }
  }

  /**
   * Initiates a brand-new game session.
   * 
   * @param {void} - No input parameters.
   * @returns {void}
   * @description Resets game state, starts procedural 90s techno music, and loads Level 1.
   */
  public startNewGame(): void {
    this.state = {
      level: 1,
      score: 0,
      lives: 3,
      shufflesRemainingInStreak: 3,
      ropes: [],
      gridSize: 10,
      shape: 'apple',
      validCells: new Set(),
      isPlaying: true,
      isGameOver: false
    };

    this.uiContainer.removeChildren();
    this.hud.container.visible = true;
    this.boardContainer.visible = true;

    this.hud.updateLevel(this.state.level);
    this.hud.updateScore(this.state.score);
    this.hud.updateLives(this.state.lives);
    this.hud.updateShuffleCounter(this.state.shufflesRemainingInStreak);

    this.audio.start();
    this.loadLevel(this.state.level);
  }

  /**
   * Generates and mounts a mathematically verified silhouette maze level.
   * 
   * @param {number} level - Target level to construct.
   * @returns {void}
   * @description Generates non-overlapping ropes inside silhouette shape, creates graphic handles, and updates board layout.
   */
  private loadLevel(level: number): void {
    const levelData = generateSolvableLevel(level);
    this.state.ropes = levelData.ropes;
    this.state.gridSize = levelData.gridSize;
    this.state.shape = levelData.shape;
    this.state.validCells = levelData.validCells;
    this.totalRopesInCurrentLevel = levelData.ropes.length;

    this.cellSize = this.boardPixelSize / this.state.gridSize;

    this.renderBoard();
    this.hud.updateProgress(0);
    this.hud.updateLevel(level);

    const shapeIcons: Record<string, string> = {
      apple: '🍎 APPLE MAZE',
      heart: '❤️ HEART MAZE',
      diamond: '💎 DIAMOND MAZE',
      shield: '🛡️ SHIELD MAZE',
      circle: '⚪ CIRCLE MAZE',
      square: '🔲 SQUARE MAZE'
    };

    const badge = shapeIcons[this.state.shape] || `LEVEL ${level}`;
    spawnFloatingText(
      this.fxContainer,
      badge,
      this.app.screen.width / 2,
      this.app.screen.height / 2,
      0x00F0FF
    );
  }

  /**
   * Handles user tapping on a rope knot or arrow head.
   * 
   * @param {Rope} rope - The tapped rope.
   * @returns {void}
   * @description Evaluates exit path. Slithers rope out on success; triggers recoil and penalty on collision.
   */
  private handleKnotTap(rope: Rope): void {
    if (!this.state.isPlaying || this.state.isGameOver) return;

    const handle = this.activeRopeHandles.get(rope.id);
    if (!handle) return;

    const canExit = canRopeExit(rope, this.state.ropes, this.state.gridSize, this.state.validCells);

    if (canExit) {
      // SUCCESSFUL UNTANGLE
      this.audio.playSuccessSound();
      this.state.score += 1;
      this.hud.updateScore(this.state.score);

      // Remove from active data model
      this.state.ropes = this.state.ropes.filter(r => r.id !== rope.id);
      this.activeRopeHandles.delete(rope.id);

      // Trigger Snake Slither Out Animation
      handle.animateSlitherOut(this.cellSize, this.boardOriginX, this.boardOriginY, () => {
        this.ropesContainer.removeChild(handle.container);
        handle.container.destroy();
      });

      // Spawn celebration particles
      const headPos = rope.body[rope.body.length - 1];
      const headPixelX = this.boardOriginX + (headPos.x + 0.5) * this.cellSize;
      const headPixelY = this.boardOriginY + (headPos.y + 0.5) * this.cellSize;
      floodEmojis(this.fxContainer, headPixelX, headPixelY, 15);
      spawnFloatingText(this.fxContainer, '+1', headPixelX, headPixelY - 15, 0x00FF66);

      // Update progress
      const clearedCount = this.totalRopesInCurrentLevel - this.state.ropes.length;
      this.hud.updateProgress(clearedCount / this.totalRopesInCurrentLevel);

      // Check for Level Completion
      if (this.state.ropes.length === 0) {
        this.audio.playFanfareSound();
        floodEmojis(this.fxContainer, this.app.screen.width / 2, this.app.screen.height / 2, 45);
        spawnFloatingText(
          this.fxContainer,
          'LEVEL CLEARED! 🎉',
          this.app.screen.width / 2,
          this.app.screen.height / 2,
          0xFFE600
        );

        setTimeout(() => {
          this.state.level += 1;
          this.loadLevel(this.state.level);
        }, 800);
        return;
      }

      // Check 3-Tap Shuffle Mechanism
      this.state.shufflesRemainingInStreak -= 1;
      if (this.state.shufflesRemainingInStreak <= 0) {
        this.triggerShuffle();
      } else {
        this.hud.updateShuffleCounter(this.state.shufflesRemainingInStreak);
      }
    } else {
      // ILLEGAL / BLOCKED TAP
      this.audio.playErrorSound();
      handle.animateBlockedShake(this.cellSize, this.boardOriginX, this.boardOriginY);
      triggerScreenShake(this.rootContainer, 12, 0.2);

      this.state.lives -= 1;
      this.hud.updateLives(this.state.lives);
      spawnFloatingText(this.fxContainer, 'BLOCKED! 💔', this.app.screen.width / 2, this.app.screen.height / 2, 0xFF3366);

      if (this.state.lives <= 0) {
        this.triggerGameOver();
      }
    }
  }

  /**
   * Executes the 3-tap shuffle rearrangement within silhouette bounds.
   * 
   * @param {void} - No input parameters.
   * @returns {void}
   * @description Shuffles active ropes, plays sound FX, flashes floating banner, and resets countdown to 3.
   */
  private triggerShuffle(): void {
    this.audio.playShuffleSound();
    this.state.shufflesRemainingInStreak = 3;
    this.hud.updateShuffleCounter(this.state.shufflesRemainingInStreak);

    spawnFloatingText(
      this.fxContainer,
      '⚡ MAZE SHUFFLED! ⚡',
      this.app.screen.width / 2,
      this.app.screen.height / 2,
      0xFF9900
    );

    // Shuffle model
    this.state.ropes = shuffleRemainingRopes(this.state.ropes, this.state.gridSize, this.state.validCells);

    // Animate subtle container twist on shuffle
    gsap.timeline()
      .to(this.ropesContainer.scale, { x: 0.95, y: 0.95, duration: 0.1, yoyo: true, repeat: 1 })
      .to(this.ropesContainer, {
        rotation: 0.08,
        duration: 0.08,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          this.ropesContainer.rotation = 0;
          this.renderBoard();
        }
      });
  }

  /**
   * Handles player losing all lives and transitions back to the home screen.
   * 
   * @param {void} - No input parameters.
   * @returns {void}
   * @description Halts game loop, stops procedural music, and displays Game Over modal.
   */
  private triggerGameOver(): void {
    this.state.isPlaying = false;
    this.state.isGameOver = true;
    this.audio.stop();

    spawnFloatingText(
      this.fxContainer,
      'GAME OVER',
      this.app.screen.width / 2,
      this.app.screen.height / 2 - 30,
      0xFF0055
    );

    setTimeout(() => {
      this.setupHomeScreen();
    }, 1200);
  }

  /**
   * Renders the silhouette background matrix and all active rope graphics.
   * 
   * @param {void} - No input parameters.
   * @returns {void}
   * @description Draws subtle silhouette background cell meshes and instantiates rope graphic handles.
   */
  private renderBoard(): void {
    this.ropesContainer.removeChildren();
    this.activeRopeHandles.clear();

    // 1. Draw Silhouette Board Cell Cells
    this.boardBg.clear();

    // Render subtle background tiles for all valid shape cells
    for (const cellKey of this.state.validCells) {
      const [gx, gy] = cellKey.split(',').map(Number);
      const px = this.boardOriginX + gx * this.cellSize;
      const py = this.boardOriginY + gy * this.cellSize;

      this.boardBg.roundRect(px + 1, py + 1, this.cellSize - 2, this.cellSize - 2, 4);
    }
    this.boardBg.fill({ color: 0x131D31, alpha: 0.7 });
    this.boardBg.stroke({ color: 0x1E2E4E, width: 1, alpha: 0.4 });

    // 2. Instantiate and draw each active rope
    for (const rope of this.state.ropes) {
      const handle = createRopeGraphic(rope, (r) => this.handleKnotTap(r));
      handle.updateLayout(this.cellSize, this.boardOriginX, this.boardOriginY);
      this.ropesContainer.addChild(handle.container);
      this.activeRopeHandles.set(rope.id, handle);
    }
  }

  /**
   * Dynamically resizes the game viewport and maximizes the board while respecting HUD safe zones.
   * 
   * @param {void} - No input parameters.
   * @returns {void}
   * @description Calculates optimal board dimensions based on aspect ratio and updates HUD and ropes.
   */
  public handleResize(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // Reserve top and bottom HUD safe padding
    const availableHeight = height - 160;
    const availableWidth = width - 30;

    this.boardPixelSize = Math.max(260, Math.min(availableWidth, availableHeight, 620));
    this.cellSize = this.boardPixelSize / this.state.gridSize;

    this.boardOriginX = (width - this.boardPixelSize) / 2;
    this.boardOriginY = (height - this.boardPixelSize) / 2;

    this.hud.resize(width, height, this.boardPixelSize, height / 2);
    this.updateHomeScreenPositions();

    if (this.state.isPlaying) {
      this.renderBoard();
    }
  }
}
