// Sons synthétisés via Web Audio API — zéro dépendance externe
let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

let muted = false;
let _pitch = 1; // multiplicateur de pitch par thème
let _waveform = 'square'; // waveform par défaut

const GAME_OVER_BASE = [300, 250, 200, 160, 100];
const GAME_OVER_DURATIONS = [0.15, 0.15, 0.15, 0.15, 0.5];
const GAME_OVER_DELAYS = [0, 120, 240, 360, 480];

const DIFF_PITCH = { easy: 0.7, normal: 1, hard: 1.4 };
const DIFF_WAVE = { easy: 'sine', normal: 'triangle', hard: 'square' };

const VALID_WAVEFORMS = ['sine', 'square', 'triangle', 'sawtooth'];

export function setThemePitch(pitch) {
  const p = Number(pitch);
  if (Number.isFinite(p)) _pitch = Math.max(0.1, Math.min(2.0, p));
}

export function setThemeWaveform(waveform) {
  if (VALID_WAVEFORMS.includes(waveform)) _waveform = waveform;
}

export function getThemeWaveform() {
  return _waveform;
}

export function getThemePitch() {
  return _pitch;
}

export function toggleMute() {
  muted = !muted;
  if (ctx) {
    if (muted && ctx.state === 'running') ctx.suspend();
    else if (!muted && ctx.state === 'suspended') ctx.resume();
  }
  return muted;
}

export function isMuted() {
  return muted;
}

function playTone(freq, duration, type, volume = 0.1) {
  const oscType = type || _waveform;
  if (muted) return;
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = oscType;
    osc.frequency.value = freq * _pitch;
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  } catch { /* AudioContext pas disponible */ }
}

export function playMove() {
  playTone(220, 0.04, 'square', 0.05);
}

export function playRotate() {
  playTone(440, 0.06, 'square', 0.07);
}

export function playDrop() {
  playTone(120, 0.15, 'triangle', 0.12);
}

export function playLock() {
  playTone(160, 0.08, 'triangle', 0.06);
}

export function playClear(count) {
  const baseFreq = 400 + count * 100;
  playTone(baseFreq, 0.2, 'sine', 0.15);
  setTimeout(() => playTone(baseFreq * 1.5, 0.15, 'sine', 0.1), 80);
}

export function playGameOver(difficulty) {
  const mul = DIFF_PITCH[difficulty] || 1;
  const wave = DIFF_WAVE[difficulty] || 'sawtooth';
  for (let i = 0; i < GAME_OVER_BASE.length; i++) {
    const freq = GAME_OVER_BASE[i] * mul;
    const dur = GAME_OVER_DURATIONS[i];
    const vol = i === GAME_OVER_BASE.length - 1 ? 0.15 : 0.12;
    if (i === 0) {
      playTone(freq, dur, wave, vol);
    } else {
      setTimeout(() => playTone(freq, dur, wave, vol), GAME_OVER_DELAYS[i]);
    }
  }
}

export function playLevelUp(difficulty) {
  const mul = DIFF_PITCH[difficulty] || 1;
  const wave = DIFF_WAVE[difficulty] || 'sine';
  const base = 500 * mul;
  playTone(base, 0.1, wave, 0.12);
  setTimeout(() => playTone(base * 1.2, 0.1, wave, 0.12), 80);
  setTimeout(() => playTone(base * 1.6, 0.2, wave, 0.15), 160);
}

export function playTSpin(difficulty) {
  const mul = DIFF_PITCH[difficulty] || 1;
  const wave = DIFF_WAVE[difficulty] || 'sine';
  const base = 600 * mul;
  playTone(base, 0.08, wave, 0.12);
  setTimeout(() => playTone(base * 1.33, 0.08, wave, 0.12), 60);
  setTimeout(() => playTone(base * 1.67, 0.15, wave, 0.15), 120);
}

export function playCombo(n, difficulty) {
  const mul = DIFF_PITCH[difficulty] || 1;
  const wave = DIFF_WAVE[difficulty] || 'triangle';
  const base = (300 + Math.min(n, 8) * 60) * mul;
  playTone(base, 0.08, wave, 0.12);
  setTimeout(() => playTone(base * 1.25, 0.08, wave, 0.12), 50);
  if (n >= 3) {
    setTimeout(() => playTone(base * 1.5, 0.12, wave, 0.1), 100);
  }
  if (n >= 6) {
    setTimeout(() => playTone(base * 2, 0.15, wave, 0.12), 150);
  }
}

export function playBackToBack() {
  playTone(500, 0.05, 'square', 0.08);
  setTimeout(() => playTone(650, 0.05, 'square', 0.08), 35);
  setTimeout(() => playTone(800, 0.05, 'square', 0.08), 70);
  setTimeout(() => playTone(1000, 0.12, 'sine', 0.12), 105);
}

const VICTORY_BASE = [523, 659, 784, 1047];
const VICTORY_DURATIONS = [0.15, 0.15, 0.15, 0.3];
const VICTORY_DELAYS = [0, 120, 240, 360];
const VICTORY_VOLUMES = [0.12, 0.12, 0.12, 0.15];

export function playVictory(difficulty) {
  const mul = DIFF_PITCH[difficulty] || 1;
  const wave = DIFF_WAVE[difficulty] || 'triangle';
  for (let i = 0; i < VICTORY_BASE.length; i++) {
    const freq = VICTORY_BASE[i] * mul;
    if (i === 0) {
      playTone(freq, VICTORY_DURATIONS[i], wave, VICTORY_VOLUMES[i]);
    } else {
      setTimeout(() => playTone(freq, VICTORY_DURATIONS[i], wave, VICTORY_VOLUMES[i]), VICTORY_DELAYS[i]);
    }
  }
}
