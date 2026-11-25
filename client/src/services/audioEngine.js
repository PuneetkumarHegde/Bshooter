/**
 * audioEngine.js — Synthesized audio via the Web Audio API (spec §57, §58, §59).
 *
 * All sounds are generated at runtime (oscillators + noise), so there are NO
 * copyrighted audio files. Sound effects and background music are INDEPENDENTLY
 * controllable, and the controls genuinely gate audio:
 *   - sound OFF  -> no gameplay sound is produced at all
 *   - music OFF  -> the background music loop is actually stopped
 *
 * This is a singleton shared across the app.
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.soundEnabled = true;
    this.musicEnabled = true;
    this.musicTimer = null;
    this.musicStep = 0;
    this._loadPrefs();
  }

  _loadPrefs() {
    try {
      const raw = localStorage.getItem('bshooter.audio');
      if (raw) {
        const p = JSON.parse(raw);
        this.soundEnabled = p.sound ?? true;
        this.musicEnabled = p.music ?? true;
      }
    } catch {
      /* ignore */
    }
  }

  _savePrefs() {
    try {
      localStorage.setItem('bshooter.audio', JSON.stringify({ sound: this.soundEnabled, music: this.musicEnabled }));
    } catch {
      /* ignore */
    }
  }

  /** Must be called from a user gesture (browser autoplay policy). */
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.16;
    this.musicGain.connect(this.master);
  }

  setSoundEnabled(on) {
    this.soundEnabled = on;
    this._savePrefs();
  }

  setMusicEnabled(on) {
    this.musicEnabled = on;
    this._savePrefs();
    if (on) this.startMusic();
    else this.stopMusic();
  }

  _tone({ freq = 440, type = 'sine', dur = 0.12, gain = 0.3, slideTo = null, delay = 0 }) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  _noise({ dur = 0.14, gain = 0.25 }) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const frames = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    const d = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 800;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur);
  }

  /** Play a named sound effect. No-op when sound is disabled. */
  play(name) {
    if (!this.soundEnabled) return;
    this.ensure();
    if (!this.ctx) return;
    switch (name) {
      case 'click':
        this._tone({ freq: 520, type: 'triangle', dur: 0.07, gain: 0.2 });
        break;
      case 'aim':
        this._tone({ freq: 300, type: 'sine', dur: 0.05, gain: 0.08 });
        break;
      case 'launch':
        this._tone({ freq: 480, type: 'square', dur: 0.09, gain: 0.18, slideTo: 760 });
        break;
      case 'collision':
        this._tone({ freq: 220, type: 'sine', dur: 0.06, gain: 0.14 });
        break;
      case 'pop':
        this._tone({ freq: 660, type: 'triangle', dur: 0.1, gain: 0.22, slideTo: 990 });
        this._noise({ dur: 0.08, gain: 0.08 });
        break;
      case 'multiPop':
        [660, 880, 1100].forEach((f, i) => this._tone({ freq: f, type: 'triangle', dur: 0.12, gain: 0.2, delay: i * 0.05 }));
        break;
      case 'combo':
        this._tone({ freq: 880, type: 'sine', dur: 0.14, gain: 0.22, slideTo: 1320 });
        break;
      case 'floatingFall':
        this._tone({ freq: 400, type: 'sine', dur: 0.3, gain: 0.16, slideTo: 120 });
        break;
      case 'bomb':
        this._noise({ dur: 0.3, gain: 0.3 });
        this._tone({ freq: 120, type: 'sawtooth', dur: 0.3, gain: 0.25, slideTo: 40 });
        break;
      case 'rainbow':
        [523, 659, 784, 1046].forEach((f, i) => this._tone({ freq: f, type: 'sine', dur: 0.14, gain: 0.16, delay: i * 0.04 }));
        break;
      case 'rescue':
        [659, 880, 1174].forEach((f, i) => this._tone({ freq: f, type: 'triangle', dur: 0.18, gain: 0.22, delay: i * 0.08 }));
        break;
      case 'booster':
        this._tone({ freq: 720, type: 'square', dur: 0.1, gain: 0.16, slideTo: 420 });
        break;
      case 'levelComplete':
        [523, 659, 784, 1046, 1318].forEach((f, i) => this._tone({ freq: f, type: 'triangle', dur: 0.22, gain: 0.24, delay: i * 0.12 }));
        break;
      case 'levelFailed':
        [440, 330, 220].forEach((f, i) => this._tone({ freq: f, type: 'sawtooth', dur: 0.3, gain: 0.2, delay: i * 0.14 }));
        break;
      case 'highScore':
        [784, 988, 1318, 1568].forEach((f, i) => this._tone({ freq: f, type: 'sine', dur: 0.2, gain: 0.22, delay: i * 0.1 }));
        break;
      default:
        break;
    }
  }

  /** Looping, gentle arpeggio background music. Stops cleanly when disabled. */
  startMusic() {
    if (!this.musicEnabled) return;
    this.ensure();
    if (!this.ctx || this.musicTimer) return;
    const scale = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63]; // C major-ish motif
    const stepMs = 420;
    const tick = () => {
      if (!this.musicEnabled || !this.ctx) return;
      const freq = scale[this.musicStep % scale.length];
      const t0 = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(1, t0 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(t0);
      osc.stop(t0 + 0.45);
      // soft bass every other step
      if (this.musicStep % 2 === 0) this._tone({ freq: freq / 2, type: 'triangle', dur: 0.3, gain: 0.05 });
      this.musicStep++;
    };
    tick();
    this.musicTimer = setInterval(tick, stepMs);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

const audio = new AudioEngine();
export default audio;
