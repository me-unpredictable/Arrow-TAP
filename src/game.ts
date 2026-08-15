/**
 * @file game.ts
 * @author @me__unpredictable
 * @description Main game controller for Arrow Tap with screen-adaptive rendering, 3-2-1-GO countdown,
 * mobile tap vibrations, 100ms victory haptics, HUD mute button, and 3-tap shuffle.
 */

import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { GameState, Rope, TechnoAudioController } from './types';
import { createTechnoAudioEngine } from './audio/technoSynth';
import { createRopeGraphic, RopeGraphicHandle } from './rendering/ropeRenderer';
import { generateSolvableLevel } from './math/mazeGenerator';
import { canRopeExit } from './math/solver';
import { shuffleRemainingRopes } from './math/shuffler';
import { createHud, HudController } from './ui/hud';
import { createStartButton } from './ui/startButton';
import { floodEmojis, spawnFloatingText, triggerScreenShake } from './fx/juice';
import { getRandomCheeringPhrase } from './fx/phrases';
import { triggerTapHaptic, triggerVictoryHaptic } from './fx/haptics';

export class ArrowTapGame {
  private app: PIXI.Application;
  private audio: TechnoAudioController;
  private hud: HudController;

  private rootContainer: PIXI.Container;
  private boardContainer: PIXI.Container;
  private ropesContainer: PIXI.Container;
  private uiContainer: PIXI.Container;
  private fxContainer: PIXI.Container;
  private countdownContainer: PIXI.Container;
  private boardBg: PIXI.Graphics;

  private state: GameState;
  private activeRopeHandles: Map<number, RopeGraphicHandle> = new Map();

  private boardOriginX = 0;
  private boardOriginY = 0;
  private cellSize = 30;
  private boardPixelSize = 600;
  private totalRopesInCurrentLevel = 0;
  private isCountingDown = false;

  private startButtonContainer: PIXI.Container | null = null;
  private titleContainer: PIXI.Container | null = null;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.audio = createTechnoAudioEngine();

    this.state = {
      level: 1,
      score: 0,
      lives: 3,
      shufflesRemainingInStreak: 3,
      ropes: [],
      gridSize: 24,
      shapeName: 'Car',
      validCells: new Set(),
      isPlaying: false,
      isGameOver: false,
      isMuted: false
    };

    this.rootContainer = new PIXI.Container();
    this.app.stage.addChild(this.rootContainer);

    this.boardContainer = new PIXI.Container();
    this.boardBg = new PIXI.Graphics();
    this.ropesContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();
    this.fxContainer = new PIXI.Container();
    this.countdownContainer = new PIXI.Container();

    this.rootContainer.addChild(this.boardContainer);
    this.boardContainer.addChild(this.boardBg);
    this.boardContainer.addChild(this.ropesContainer);

    this.hud = createHud(() => this.toggleMute());
    this.rootContainer.addChild(this.hud.container);
    this.rootContainer.addChild(this.fxContainer);
    this.rootContainer.addChild(this.countdownContainer);
    this.rootContainer.addChild(this.uiContainer);

    this.setupHomeScreen();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  private toggleMute(): void {
    this.state.isMuted = this.audio.toggleMute();
    this.hud.updateMuteState(this.state.isMuted);
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
      () => {
        triggerTapHaptic();
        this.audio.playTapSound();
      }
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
      this.startButtonContainer.y = cy + 60;
    }
  }

  public startNewGame(): void {
    this.state.level = 1;
    this.state.score = 0;
    this.state.lives = 3;
    this.state.shufflesRemainingInStreak = 3;
    this.state.isPlaying = true;
    this.state.isGameOver = false;

    this.uiContainer.removeChildren();
    this.hud.container.visible = true;
    this.boardContainer.visible = true;

    this.hud.updateScore(this.state.score);
    this.hud.updateLives(this.state.lives);
    this.hud.updateShuffleCounter(this.state.shufflesRemainingInStreak);

    this.audio.start();
    this.loadLevel(this.state.level);
  }

  private loadLevel(levelNum: number): void {
    const screenMinDimension = Math.min(this.app.screen.width, this.app.screen.height);
    const levelData = generateSolvableLevel(levelNum, screenMinDimension);

    this.state.gridSize = levelData.gridSize;
    this.state.ropes = levelData.ropes;
    this.state.shapeName = levelData.shapeName;
    this.state.validCells = levelData.validCells;
    this.totalRopesInCurrentLevel = levelData.ropes.length;

    this.hud.updateLevel(levelNum);
    this.hud.updateProgress(0);
    this.hud.updateShuffleCounter(this.state.shufflesRemainingInStreak);

    this.handleResize();
    this.renderBoard();
    this.startCountdownSequence();
  }

  private startCountdownSequence(): void {
    this.isCountingDown = true;
    this.countdownContainer.removeChildren();

    const countText = new PIXI.Text({
      text: '3',
      style: {
        fontFamily: 'Segoe UI, Impact, sans-serif',
        fontSize: 72,
        fontWeight: 'bold',
        fill: 0xFFE600,
        stroke: { color: 0x000000, width: 8 },
        dropShadow: { color: 0xFF9900, blur: 12, distance: 0 }
      }
    });
    countText.anchor.set(0.5);
    countText.x = this.app.screen.width / 2;
    countText.y = this.app.screen.height / 2;
    this.countdownContainer.addChild(countText);

    const steps = [
      { text: '3', color: 0xFF3366, stepNum: 3 },
      { text: '2', color: 0xFF9900, stepNum: 2 },
      { text: '1', color: 0xFFE600, stepNum: 1 },
      { text: 'GO !', color: 0x00FF66, stepNum: 0 }
    ];

    const tl = gsap.timeline({
      onComplete: () => {
        this.countdownContainer.removeChildren();
        this.isCountingDown = false;
      }
    });

    steps.forEach((step, index) => {
      tl.call(() => {
        countText.text = step.text;
        countText.style.fill = step.color;
        this.audio.playCountdownBeep(step.stepNum);
        triggerTapHaptic();
      }, undefined, index * 0.45);

      tl.fromTo(
        countText.scale,
        { x: 0.2, y: 0.2 },
        { x: 1.25, y: 1.25, duration: 0.38, ease: 'back.out(2)' },
        index * 0.45
      );
    });

    tl.call(() => {
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

    // Trigger responsive mobile tap vibration
    triggerTapHaptic();

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
        triggerVictoryHaptic(); // 0.10s celebratory vibration burst
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
    triggerTapHaptic();
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

    // Reserve minimal 54px vertical padding total (top + bottom HUD)
    const availableHeight = height - 54;
    const availableWidth = width - 16;

    // Maximize square board to fill as much screen area as possible
    this.boardPixelSize = Math.max(280, Math.min(availableWidth, availableHeight));
    this.cellSize = this.boardPixelSize / this.state.gridSize;

    this.boardOriginX = (width - this.boardPixelSize) / 2;
    this.boardOriginY = (height - this.boardPixelSize) / 2;

    this.hud.resize(width, height);
    this.updateHomeScreenPositions();

    if (this.state.isPlaying) {
      this.renderBoard();
    }
  }
}
