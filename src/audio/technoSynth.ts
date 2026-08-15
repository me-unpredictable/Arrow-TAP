/**
 * @file technoSynth.ts
 * @description Real-time procedural 90s upbeat techno synthesizer, 3-2-1-GO audio synchronization, mute toggle, and level victory fanfares using Web Audio API.
 * Requires zero downloaded audio files.
 */

import { TechnoAudioController } from '../types';

/**
 * Creates and initializes the procedural 90s techno audio engine.
 * 
 * @param {void} - No input parameters.
 * @returns {TechnoAudioController} Controller object exposing playback, sound FX, countdown sync, and mute control.
 * @description Instantiates an AudioContext and synthesizes 135 BPM 90s techno beats, basslines, arpeggios, and sound FX in real-time.
 */
export function createTechnoAudioEngine(): TechnoAudioController {
  let audioCtx: AudioContext | null = null;
  let masterGainNode: GainNode | null = null;
  let isPlaying = false;
  let isMutedState = false;
  let stepTimer: number | null = null;
  let currentStep = 0;
  let bpm = 135;

  // 90s Eurodance / Techno Pentatonic / Dorian frequency table (Hz)
  const scale = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
  const bassline = [65.41, 65.41, 73.42, 82.41, 98.00, 82.41, 73.42, 65.41];

  /**
   * Safely retrieves or initializes the AudioContext and Master Gain node.
   * 
   * @param {void} - No input parameters.
   * @returns {AudioContext} Active Web Audio context.
   * @description Lazily constructs AudioContext and handles browser autoplay unlocking.
   */
  function getAudioContext(): AudioContext {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
      masterGainNode = audioCtx.createGain();
      masterGainNode.gain.setValueAtTime(isMutedState ? 0 : 1.0, audioCtx.currentTime);
      masterGainNode.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function getAudioOutput(ctx: AudioContext): AudioNode {
    if (!masterGainNode) {
      masterGainNode = ctx.createGain();
      masterGainNode.gain.setValueAtTime(isMutedState ? 0 : 1.0, ctx.currentTime);
      masterGainNode.connect(ctx.destination);
    }
    return masterGainNode;
  }

  /**
   * Synthesizes a punchy 90s four-on-the-floor kick drum.
   */
  function triggerKick(ctx: AudioContext, time: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(gain);
    gain.connect(getAudioOutput(ctx));

    osc.start(time);
    osc.stop(time + 0.2);
  }

  /**
   * Synthesizes a crisp 90s techno snare drum using filtered white noise.
   */
  function triggerSnare(ctx: AudioContext, time: number): void {
    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(getAudioOutput(ctx));

    noise.start(time);
    noise.stop(time + 0.14);
  }

  /**
   * Synthesizes open and closed hi-hat metallic clicks.
   */
  function triggerHiHat(ctx: AudioContext, time: number, isOpen = false): void {
    const bufferSize = ctx.sampleRate * (isOpen ? 0.08 : 0.03);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(isOpen ? 0.35 : 0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isOpen ? 0.08 : 0.03));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(getAudioOutput(ctx));

    noise.start(time);
    noise.stop(time + (isOpen ? 0.09 : 0.04));
  }

  /**
   * Synthesizes 90s rolling sawtooth sub-bass line note.
   */
  function triggerBass(ctx: AudioContext, time: number, freq: number): void {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, time);
    filter.frequency.exponentialRampToValueAtTime(180, time + 0.14);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(getAudioOutput(ctx));

    osc.start(time);
    osc.stop(time + 0.16);
  }

  /**
   * Synthesizes resonant rave lead arpeggio notes.
   */
  function triggerArp(ctx: AudioContext, time: number, freq: number): void {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 2.5, time);
    filter.Q.setValueAtTime(4, time);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(getAudioOutput(ctx));

    osc.start(time);
    osc.stop(time + 0.14);
  }

  /**
   * Core 16th-note step sequencer advancing techno rhythm.
   */
  function scheduleNextStep(): void {
    if (!isPlaying) return;

    const ctx = getAudioContext();
    const stepDuration = 60 / bpm / 4; // 16th note in seconds
    const time = ctx.currentTime + 0.05;

    // 1. Kick on every 4th 16th note
    if (currentStep % 4 === 0) {
      triggerKick(ctx, time);
    }

    // 2. Snare on beats 2 and 4 (steps 4 and 12)
    if (currentStep % 8 === 4) {
      triggerSnare(ctx, time);
    }

    // 3. Hi-Hats: Closed on off-beats, open occasionally
    if (currentStep % 2 === 1) {
      triggerHiHat(ctx, time, currentStep % 4 === 2);
    }

    // 4. Rolling 16th Bassline
    const bassIdx = currentStep % bassline.length;
    triggerBass(ctx, time, bassline[bassIdx]);

    // 5. Rave Synth Arpeggio
    if (Math.random() > 0.15) {
      const noteIdx = (currentStep * 3 + Math.floor(currentStep / 4)) % scale.length;
      triggerArp(ctx, time, scale[noteIdx]);
    }

    currentStep = (currentStep + 1) % 16;
    stepTimer = window.setTimeout(scheduleNextStep, stepDuration * 1000);
  }

  return {
    start: () => {
      if (isPlaying) return;
      getAudioContext();
      isPlaying = true;
      currentStep = 0;
      scheduleNextStep();
    },

    stop: () => {
      isPlaying = false;
      if (stepTimer !== null) {
        clearTimeout(stepTimer);
        stepTimer = null;
      }
    },

    setBpm: (newBpm: number) => {
      bpm = Math.max(90, Math.min(180, newBpm));
    },

    toggleMute: (): boolean => {
      isMutedState = !isMutedState;
      if (masterGainNode && audioCtx) {
        masterGainNode.gain.setValueAtTime(isMutedState ? 0 : 1.0, audioCtx.currentTime);
      }
      return isMutedState;
    },

    isMuted: (): boolean => {
      return isMutedState;
    },

    playTapSound: () => {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.06);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(getAudioOutput(ctx));

      osc.start(now);
      osc.stop(now + 0.08);
    },

    playSuccessSound: () => {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(getAudioOutput(ctx));

      osc.start(now);
      osc.stop(now + 0.15);
    },

    playErrorSound: () => {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.15);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(getAudioOutput(ctx));

      osc.start(now);
      osc.stop(now + 0.2);
    },

    playShuffleSound: () => {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.25);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(getAudioOutput(ctx));

      osc.start(now);
      osc.stop(now + 0.26);
    },

    playFanfareSound: () => {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const chords = [
        [523.25, 659.25, 783.99],   // C Major
        [587.33, 739.99, 880.00],   // D Major
        [659.25, 830.61, 987.77],   // E Major
        [1046.50, 1318.51, 1567.98] // High C Super Fanfare
      ];

      chords.forEach((chord, stepIdx) => {
        chord.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + stepIdx * 0.12);

          gain.gain.setValueAtTime(0.18, now + stepIdx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + stepIdx * 0.12 + 0.35);

          osc.connect(gain);
          gain.connect(getAudioOutput(ctx));

          osc.start(now + stepIdx * 0.12);
          osc.stop(now + stepIdx * 0.12 + 0.38);
        });
      });
    },

    playCountdownBeep: (stepNum: number) => {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = stepNum === 0 ? 880 : (440 + (3 - stepNum) * 110);
      osc.type = stepNum === 0 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (stepNum === 0 ? 0.35 : 0.18));

      osc.connect(gain);
      gain.connect(getAudioOutput(ctx));

      osc.start(now);
      osc.stop(now + (stepNum === 0 ? 0.38 : 0.2));
    }
  };
}
