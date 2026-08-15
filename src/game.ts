/**
 * @file game.ts
 * @description Main game controller with full-screen adaptive maze scaling, ultra-thin winding ropes, 3-2-1-GO audio countdown, and 50 cheering phrases.
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
import { getRandomCheeringPhrase } from './fx/phrases';

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
  private countdownContainer = new PIXI.Container();

  private state: GameState = {
    level: 1,
    score: 0,
    lives: 3,
    shufflesRemainingInStreak: 3,
    ropes: [],
    gridSize: 20,
    shapeName: 'Car',
    validCells: new Set(),
    isPlaying: false,
    isGameOver: false
  };

  private activeRopeHandles: Map<number, RopeGraphicHandle> = new Map();
  private totalRopesInCurrentLevel = 0;
  private startButtonContainer: PIXI.Container | null = null;
  private titleContainer: PIXI.Container | null = null;
  private isCountingDown = false;

  private boardOriginX = 0;
  private boardOriginY = 0;
  private boardPixelSize = 0;
  private cellSize = 0;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.app.stage.addChild(this.rootContainer);

    this.rootContainer.addChild(this.boardContainer);
    this.boardContainer.addChild(this.boardBg);
    this.boardContainer.addChild(this.ropesContainer);

    this.hud = createHud();
    this.rootContainer.addChild(this.hud.container);
    this.rootContainer.addChild(this.fxContainer);
    this.rootContainer.addChild(this.countdownContainer);
    this.rootContainer.addChild(this.uiContainer);

    this.setupHomeScreen();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  private setupHomeScreen(): void {
    this.uiContainer.removeChildren();
    this.hud.container.visible = false;
    this.boardContainer.visible = false;
    this.countdownContainer.removeChildren();

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

    this.startButtonContainer = createStartButton(
      () => this.startNewGame(),
      () => this.audio.playTapSound()
    );
    this.uiContainer.addChild(this.startButtonContainer);

    this.updateHomeScreenPositions();
  }

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

  public startNewGame(): void {
    this.state = {
      level: 1,
      score: 0,
      lives: 3,
      shufflesRemainingInStreak: 3,
      ropes: [],
      gridSize: 20,
      shapeName: 'Car',
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

    this.loadLevel(this.state.level);
  }

  private runCountdown(onReady: () => void): void {
    this.isCountingDown = true;
    this.countdownContainer.removeChildren();
    const cx = this.app.screen.width / 2;
    const cy = this.app.screen.height / 2;

    const steps = [
      { text: '3', num: 3, color: 0x00F0FF },
      { text: '2', num: 2, color: 0xFFE600 },
      { text: '1', num: 1, color: 0xFF9900 },
      { text: 'GO !', num: 0, color: 0x00FF66 }
    ];

    let current = 0;

    const playNextStep = () => {
      if (current >= steps.length) {
        this.isCountingDown = false;
        this.countdownContainer.removeChildren();
        this.audio.start();
        onReady();
        return;
      }

      const item = steps[current];
      this.audio.playCountdownBeep(item.num);

      this.countdownContainer.removeChildren();
      const txt = new PIXI.Text({
        text: item.text,
        style: {
          fontFamily: 'Segoe UI, Impact, sans-serif',
          fontSize: item.text === 'GO !' ? 68 : 80,
          fontWeight: 'bold',
          fill: item.color,
          stroke: { color: 0x000000, width: 8 },
          dropShadow: { color: item.color, blur: 16, distance: 0 }
        }
      });
      txt.anchor.set(0.5);
      txt.x = cx;
      txt.y = cy;
      txt.scale.set(0.2);
      this.countdownContainer.addChild(txt);

      gsap.timeline({ onComplete: () => {
        current++;
        playNextStep();
      }})
      .to(txt.scale, { x: 1.2, y: 1.2, duration: 0.18, ease: 'back.out(2)' })
      .to(txt.scale, { x: 1.0, y: 1.0, duration: 0.15 })
      .to(txt, { alpha: 0, duration: 0.12 });
    };

    playNextStep();
  }

  private loadLevel(level: number): void {
    // Generate adaptive level size matched to screen pixel dimensions
    const minScreenDim = Math.min(this.app.screen.width, this.app.screen.height);
    const levelData = generateSolvableLevel(level, minScreenDim);

    this.state.ropes = levelData.ropes;
    this.state.gridSize = levelData.gridSize;
    this.state.shapeName = levelData.shapeName;
    this.state.validCells = levelData.validCells;
    this.totalRopesInCurrentLevel = levelData.ropes.length;

    this.cellSize = this.boardPixelSize / this.state.gridSize;

    this.renderBoard();
    this.hud.updateProgress(0);
    this.hud.updateLevel(level);

    this.runCountdown(() => {
      spawnFloatingText(
        this.fxContainer,
        `📍 ${this.state.shapeName.toUpperCase()}`,
        this.app.screen.width / 2,
        this.boardOriginY + 30,
        0x00F0FF
      );
    });
  }

  private handleKnotTap(rope: Rope): void {
    if (!this.state.isPlaying || this.state.isGameOver || this.isCountingDown) return;

    const handle = this.activeRopeHandles.get(rope.id);
    if (!handle) return;

    const canExit = canRopeExit(rope, this.state.ropes, this.state.gridSize);

    if (canExit) {
      this.audio.playSuccessSound();
      this.state.score += 1;
      this.hud.updateScore(this.state.score);

      this.state.ropes = this.state.ropes.filter(r => r.id !== rope.id);
      this.activeRopeHandles.delete(rope.id);

      handle.animateSlitherOut(this.cellSize, this.boardOriginX, this.boardOriginY, () => {
        this.ropesContainer.removeChild(handle.container);
        handle.container.destroy();
      });

      const headPos = rope.body[rope.body.length - 1];
      const headPixelX = this.boardOriginX + (headPos.x + 0.5) * this.cellSize;
      const headPixelY = this.boardOriginY + (headPos.y + 0.5) * this.cellSize;
      floodEmojis(this.fxContainer, headPixelX, headPixelY, 10);
      spawnFloatingText(this.fxContainer, '+1', headPixelX, headPixelY - 12, 0x00FF66);

      const clearedCount = this.totalRopesInCurrentLevel - this.state.ropes.length;
      this.hud.updateProgress(clearedCount / this.totalRopesInCurrentLevel);

      if (this.state.ropes.length === 0) {
        this.audio.playFanfareSound();
        floodEmojis(this.fxContainer, this.app.screen.width / 2, this.app.screen.height / 2, 45);

        const cheeringPhrase = getRandomCheeringPhrase();
        spawnFloatingText(
          this.fxContainer,
          cheeringPhrase,
          this.app.screen.width / 2,
          this.app.screen.height / 2,
          0xFFE600
        );

        setTimeout(() => {
          this.state.level += 1;
          this.loadLevel(this.state.level);
        }, 1200);
        return;
      }

      this.state.shufflesRemainingInStreak -= 1;
      if (this.state.shufflesRemainingInStreak <= 0) {
        this.triggerShuffle();
      } else {
        this.hud.updateShuffleCounter(this.state.shufflesRemainingInStreak);
      }
    } else {
      this.audio.playErrorSound();
      handle.animateBlockedShake(this.cellSize, this.boardOriginX, this.boardOriginY);
      triggerScreenShake(this.rootContainer, 10, 0.2);

      this.state.lives -= 1;
      this.hud.updateLives(this.state.lives);
      spawnFloatingText(this.fxContainer, 'BLOCKED! 💔', this.app.screen.width / 2, this.app.screen.height / 2, 0xFF3366);

      if (this.state.lives <= 0) {
        this.triggerGameOver();
      }
    }
  }

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

    this.state.ropes = shuffleRemainingRopes(this.state.ropes, this.state.gridSize, this.state.validCells);
    this.totalRopesInCurrentLevel = Math.max(this.totalRopesInCurrentLevel, this.state.ropes.length);
    const cleared = Math.max(0, this.totalRopesInCurrentLevel - this.state.ropes.length);
    this.hud.updateProgress(cleared / this.totalRopesInCurrentLevel);

    gsap.timeline()
      .to(this.ropesContainer.scale, { x: 0.96, y: 0.96, duration: 0.08, yoyo: true, repeat: 1 })
      .to(this.ropesContainer, {
        rotation: 0.06,
        duration: 0.08,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          this.ropesContainer.rotation = 0;
          this.renderBoard();
        }
      });
  }

  private triggerGameOver(): void {
    this.state.isPlaying = false;
    this.state.isGameOver = true;
    this.audio.stop();

    spawnFloatingText(
      this.fxContainer,
      'GAME OVER',
      this.app.screen.width / 2,
      this.app.screen.height / 2 - 20,
      0xFF0055
    );

    setTimeout(() => {
      this.setupHomeScreen();
    }, 1200);
  }

  private renderBoard(): void {
    this.ropesContainer.removeChildren();
    this.activeRopeHandles.clear();

    this.boardBg.clear();

    for (const cellKey of this.state.validCells) {
      const [gx, gy] = cellKey.split(',').map(Number);
      const px = this.boardOriginX + gx * this.cellSize;
      const py = this.boardOriginY + gy * this.cellSize;

      this.boardBg.roundRect(px + 0.3, py + 0.3, this.cellSize - 0.6, this.cellSize - 0.6, 2);
    }
    this.boardBg.fill({ color: 0x101728, alpha: 0.7 });
    this.boardBg.stroke({ color: 0x1A2640, width: 0.6, alpha: 0.35 });

    for (const rope of this.state.ropes) {
      const handle = createRopeGraphic(rope, (r) => this.handleKnotTap(r));
      handle.updateLayout(this.cellSize, this.boardOriginX, this.boardOriginY);
      this.ropesContainer.addChild(handle.container);
      this.activeRopeHandles.set(rope.id, handle);
    }
  }

  public handleResize(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // Reserve minimal 45px vertical padding total (top + bottom HUD)
    const availableHeight = height - 54;
    const availableWidth = width - 16;

    // Maximize square board to fill as much screen area as possible
    this.boardPixelSize = Math.max(280, Math.min(availableWidth, availableHeight));
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
