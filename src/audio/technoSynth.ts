/**
 * @file technoSynth.ts
 * @description Real-time procedural 90s upbeat techno synthesizer, 3-2-1-GO audio synchronization, and level victory fanfares using Web Audio API.
 * Requires zero downloaded audio files.
 */

import { TechnoAudioController } from '../types';

/**
 * Creates and initializes the procedural 90s techno audio engine.
 * 
 * @param {void} - No input parameters.
 * @returns {TechnoAudioController} Controller object exposing playback, sound FX, and countdown sync methods.
 * @description Instantiates an AudioContext and synthesizes 135 BPM 90s techno beats, basslines, arpeggios, and sound FX in real-time.
 */
export function createTechnoAudioEngine(): TechnoAudioController {
  let audioCtx: AudioContext | null = null;
  let isPlaying = false;
  let stepTimer: number | null = null;
  let currentStep = 0;
  let bpm = 135;

  // 90s Eurodance / Techno Pentatonic / Dorian frequency table (Hz)
  const scale = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
  const bassline = [65.41, 65.41, 73.42, 82.41, 98.00, 82.41, 73.42, 65.41];

  /**
   * Safely retrieves or initializes the AudioContext instance.
   * 
   * @param {void} - No input parameters.
   * @returns {AudioContext} Active Web Audio context.
   * @description Lazily constructs AudioContext and handles browser autoplay unlocking.
   */
  function getAudioContext(): AudioContext {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  /**
   * Synthesizes a punchy 90s four-on-the-floor kick drum.
   * 
   * @param {AudioContext} ctx - Web Audio context.
   * @param {number} time - Audio scheduled start time.
   * @returns {void}
   * @description Generates a rapid exponential pitch-dropping sine oscillator with a snappy envelope.
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
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  /**
   * Synthesizes a crisp 90s techno snare drum using filtered white noise.
   * 
   * @param {AudioContext} ctx - Web Audio context.
   * @param {number} time - Audio scheduled start time.
   * @returns {void}
   * @description Generates audio buffer noise through a bandpass filter with fast decay.
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
    gain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + 0.13);
  }

  /**
   * Synthesizes a driving 90s rave arpeggio note.
   * 
   * @param {AudioContext} ctx - Web Audio context.
   * @param {number} time - Audio scheduled start time.
   * @param {number} noteFreq - Frequency of the note in Hz.
   * @returns {void}
   * @description Plays a bright sawtooth wave through a resonant lowpass filter.
   */
  function triggerArpNote(ctx: AudioContext, time: number, noteFreq: number): void {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(noteFreq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2500, time);
    filter.Q.setValueAtTime(4, time);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.11);
  }

  /**
   * Synthesizes an offbeat sub-bass pulse.
   * 
   * @param {AudioContext} ctx - Web Audio context.
   * @param {number} time - Audio scheduled start time.
   * @param {number} bassFreq - Frequency of the bass note in Hz.
   * @returns {void}
   * @description Produces a punchy square-triangle hybrid bass sound.
   */
  function triggerBass(ctx: AudioContext, time: number, bassFreq: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(bassFreq, time);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  /**
   * Executes a single musical step (16th note) in the real-time sequencer.
   * 
   * @param {void} - No input parameters.
   * @returns {void}
   * @description Evaluates the current 16th-note index and schedules synthesized drums, bass, and arpeggios.
   */
  function step(): void {
    if (!isPlaying) return;
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // 4-on-the-floor Kick on steps 0, 4, 8, 12
    if (currentStep % 4 === 0) {
      triggerKick(ctx, now);
    }

    // Snare on backbeats 4 and 12
    if (currentStep % 8 === 4) {
      triggerSnare(ctx, now);
    }

    // Offbeat bassline
    if (currentStep % 2 === 1) {
      const bassIndex = Math.floor(currentStep / 2) % bassline.length;
      triggerBass(ctx, now, bassline[bassIndex]);
    }

    // Procedural random 16th-note arpeggio with high energy
    if (Math.random() > 0.15) {
      const noteIndex = (currentStep * 3 + Math.floor(Math.random() * 3)) % scale.length;
      triggerArpNote(ctx, now, scale[noteIndex]);
    }

    currentStep = (currentStep + 1) % 16;
    const intervalMs = (60 / bpm / 4) * 1000;
    stepTimer = window.setTimeout(step, intervalMs);
  }

  return {
    start: () => {
      if (isPlaying) return;
      getAudioContext();
      isPlaying = true;
      currentStep = 0;
      step();
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

    playTapSound: () => {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.05);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    },

    playSuccessSound: () => {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.035);

        gain.gain.setValueAtTime(0.2, now + index * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.035 + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.035);
        osc.stop(now + index * 0.035 + 0.16);
      });
    },

    playErrorSound: () => {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.setValueAtTime(95, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    },

    playShuffleSound: () => {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    },

    playFanfareSound: () => {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      // Grand celebratory techno victory arpeggio
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
          gain.connect(ctx.destination);

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

      // Pitch escalates: 3 (440Hz), 2 (554Hz), 1 (659Hz), GO (880Hz octave leap)
      const freq = stepNum === 0 ? 880 : (440 + (3 - stepNum) * 110);
      osc.type = stepNum === 0 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (stepNum === 0 ? 0.35 : 0.18));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + (stepNum === 0 ? 0.38 : 0.2));
    }
  };
}
