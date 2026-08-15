/**
 * @file technoSynth.ts
 * @description Real-time procedural 90s upbeat techno synthesizer and dynamic sound FX engine using the Web Audio API.
 * Requires zero downloaded audio files.
 */

import { TechnoAudioController } from '../types';

/**
 * Creates and initializes the procedural 90s techno audio engine.
 * 
 * @param {void} - No input parameters.
 * @returns {TechnoAudioController} Controller object exposing playback and sound effect methods.
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
   * @description Produces a punchy square-sine hybrid bass sound.
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
    /**
     * Starts procedural 90s techno music playback.
     * 
     * @param {void} - No input parameters.
     * @returns {void}
     * @description Initiates the real-time procedural step loop.
     */
    start: () => {
      if (isPlaying) return;
      getAudioContext();
      isPlaying = true;
      currentStep = 0;
      step();
    },

    /**
     * Stops procedural 90s techno music playback.
     * 
     * @param {void} - No input parameters.
     * @returns {void}
     * @description Halts the step loop and clears timeout handles.
     */
    stop: () => {
      isPlaying = false;
      if (stepTimer !== null) {
        clearTimeout(stepTimer);
        stepTimer = null;
      }
    },

    /**
     * Dynamically updates the tempo in beats per minute.
     * 
     * @param {number} newBpm - Target tempo.
     * @returns {void}
     * @description Sets the playback BPM.
     */
    setBpm: (newBpm: number) => {
      bpm = Math.max(90, Math.min(180, newBpm));
    },

    /**
     * Plays a high-frequency blip when an interactive element is tapped.
     * 
     * @param {void} - No input parameters.
     * @returns {void}
     * @description Generates a crisp tactile audio blip.
     */
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

    /**
     * Plays a rewarding celebratory sweep when a rope escapes smoothly.
     * 
     * @param {void} - No input parameters.
     * @returns {void}
     * @description Synthesizes a 3-note ascending triumph chord.
     */
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

    /**
     * Plays a dissonant buzz sound when an illegal or blocked move is tapped.
     * 
     * @param {void} - No input parameters.
     * @returns {void}
     * @description Synthesizes a low-pitch square wave error buzz.
     */
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

    /**
     * Plays a swirling whoosh sound during the 3-tap shuffle.
     * 
     * @param {void} - No input parameters.
     * @returns {void}
     * @description Synthesizes a rising frequency spiral sound.
     */
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

    /**
     * Plays a grand level completion fanfare.
     * 
     * @param {void} - No input parameters.
     * @returns {void}
     * @description Plays a rapid multi-voice celebratory arpeggio.
     */
    playFanfareSound: () => {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const arpeggio = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];

      arpeggio.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.18, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.25);
      });
    }
  };
}
