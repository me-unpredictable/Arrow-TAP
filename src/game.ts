/**
 * @file game.ts
 * @description Main game controller handling state transitions, dynamic square board layout, untangling logic, and 3-tap shuffle loops.
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
    gridSize: 6,
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
   * @description Constructs display scene hierarchy, initializes procedural audio, and prepares home screen.
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
      gridSize: 6,
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
   * Generates and mounts a mathematically verified level puzzle.
   * 
   * @param {number} level - Target level to construct.
   * @returns {void}
   * @description Generates non-overlapping ropes, builds graphic handles, and updates board layout.
   */
  private loadLevel(level: number): void {
    const generated = generateSolvableLevel(level);
    this.state.ropes = generated.ropes;
    this.state.gridSize = generated.gridSize;
    this.totalRopesInCurrentLevel = generated.ropes.length;

    this.renderBoard();
    this.hud.updateProgress(0);
    this.hud.updateLevel(level);

    spawnFloatingText(
      this.fxContainer,
      `LEVEL ${level}`,
      this.app.screen.width / 2,
      this.app.screen.height / 2,
      0x00F0FF
    );
  }

  /**
   * Handles user tapping on a rope knot.
   * 
   * @param {Rope} rope - The rope whose knot was tapped.
   * @returns {void}
   * @description Evaluates mathematical exit path. Freees rope on success; penalizes life on collision.
   */
  private handleKnotTap(rope: Rope): void {
    if (!this.state.isPlaying || this.state.isGameOver) return;

    const handle = this.activeRopeHandles.get(rope.id);
    if (!handle) return;

    const canExit = canRopeExit(rope, this.state.ropes, this.state.gridSize);

    if (canExit) {
      // SUCCESSFUL UNTANGLE
      this.audio.playSuccessSound();
      this.state.score += 1;
      this.hud.updateScore(this.state.score);

      // Remove from active data model
      this.state.ropes = this.state.ropes.filter(r => r.id !== rope.id);
      this.activeRopeHandles.delete(rope.id);

      // Trigger Slither Escape Animation
      handle.animateSlitherOut(this.cellSize, () => {
        this.ropesContainer.removeChild(handle.container);
        handle.container.destroy();
      });

      // Spawn celebration particles
      const knotPos = rope.body[rope.knotIndex];
      const knotPixelX = this.boardOriginX + (knotPos.x + 0.5) * this.cellSize;
      const knotPixelY = this.boardOriginY + (knotPos.y + 0.5) * this.cellSize;
      floodEmojis(this.fxContainer, knotPixelX, knotPixelY, 15);
      spawnFloatingText(this.fxContainer, '+1', knotPixelX, knotPixelY - 20, 0x00FF66);

      // Update progress
      const clearedCount = this.totalRopesInCurrentLevel - this.state.ropes.length;
      this.hud.updateProgress(clearedCount / this.totalRopesInCurrentLevel);

      // Check for Level Completion
      if (this.state.ropes.length === 0) {
        this.audio.playFanfareSound();
        floodEmojis(this.fxContainer, this.app.screen.width / 2, this.app.screen.height / 2, 40);
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
      handle.animateBlockedShake();
      triggerScreenShake(this.rootContainer, 14, 0.2);

      this.state.lives -= 1;
      this.hud.updateLives(this.state.lives);
      spawnFloatingText(this.fxContainer, 'BLOCKED! 💔', this.app.screen.width / 2, this.app.screen.height / 2, 0xFF3366);

      if (this.state.lives <= 0) {
        this.triggerGameOver();
      }
    }
  }

  /**
   * Executes the 3-tap shuffle rearrangement while preserving mathematical solvability.
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
    this.state.ropes = shuffleRemainingRopes(this.state.ropes, this.state.gridSize);

    // Animate subtle container twist on shuffle
    gsap.timeline()
      .to(this.ropesContainer.scale, { x: 0.9, y: 0.9, duration: 0.1, yoyo: true, repeat: 1 })
      .to(this.ropesContainer, {
        rotation: 0.1,
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
   * Renders the square board grid and all active rope graphics.
   * 
   * @param {void} - No input parameters.
   * @returns {void}
   * @description Draws square background matrix and instantiates reactive rope graphic handles.
   */
  private renderBoard(): void {
    this.ropesContainer.removeChildren();
    this.activeRopeHandles.clear();

    // 1. Draw Square Board Background
    this.boardBg.clear();
    this.boardBg.roundRect(
      this.boardOriginX - 8,
      this.boardOriginY - 8,
      this.boardPixelSize + 16,
      this.boardPixelSize + 16,
      16
    );
    this.boardBg.fill({ color: 0x111827 });
    this.boardBg.stroke({ color: 0x2563EB, width: 3, alpha: 0.6 });

    // Draw inner grid lines
    for (let i = 0; i <= this.state.gridSize; i++) {
      const pos = i * this.cellSize;
      // Vertical
      this.boardBg.moveTo(this.boardOriginX + pos, this.boardOriginY);
      this.boardBg.lineTo(this.boardOriginX + pos, this.boardOriginY + this.boardPixelSize);
      // Horizontal
      this.boardBg.moveTo(this.boardOriginX, this.boardOriginY + pos);
      this.boardBg.lineTo(this.boardOriginX + this.boardPixelSize, this.boardOriginY + pos);
    }
    this.boardBg.stroke({ color: 0x1E293B, width: 1, alpha: 0.5 });

    // 2. Instantiate and draw each active rope
    for (const rope of this.state.ropes) {
      const handle = createRopeGraphic(rope, (r) => this.handleKnotTap(r));
      handle.updateLayout(this.cellSize, this.boardOriginX, this.boardOriginY);
      this.ropesContainer.addChild(handle.container);
      this.activeRopeHandles.set(rope.id, handle);
    }
  }

  /**
   * Dynamically resizes the game viewport and maximizes the square board while respecting HUD safe zones.
   * 
   * @param {void} - No input parameters.
   * @returns {void}
   * @description Calculates optimal square dimensions based on window aspect ratio and updates HUD and ropes.
   */
  public handleResize(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // Reserve 90px top and 80px bottom for HUD
    const availableHeight = height - 180;
    const availableWidth = width - 40;

    // Strictly square board filling as much screen as possible
    this.boardPixelSize = Math.max(260, Math.min(availableWidth, availableHeight, 600));
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
