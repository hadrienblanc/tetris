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

export function playGameOver() {
  playTone(200, 0.3, 'sawtooth', 0.1);
  setTimeout(() => playTone(150, 0.3, 'sawtooth', 0.1), 200);
  setTimeout(() => playTone(100, 0.5, 'sawtooth', 0.12), 400);
}

export function playLevelUp() {
  playTone(500, 0.1, 'sine', 0.12);
  setTimeout(() => playTone(600, 0.1, 'sine', 0.12), 80);
  setTimeout(() => playTone(800, 0.2, 'sine', 0.15), 160);
}

export function playTSpin() {
  playTone(600, 0.08, 'sine', 0.12);
  setTimeout(() => playTone(800, 0.08, 'sine', 0.12), 60);
  setTimeout(() => playTone(1000, 0.15, 'sine', 0.15), 120);
}

export function playCombo(n) {
  const freq = 300 + n * 50;
  playTone(freq, 0.1, 'triangle', 0.1);
  setTimeout(() => playTone(freq * 1.3, 0.12, 'triangle', 0.1), 50);
}

export function playBackToBack() {
  playTone(500, 0.06, 'square', 0.08);
  setTimeout(() => playTone(700, 0.06, 'square', 0.08), 40);
  setTimeout(() => playTone(900, 0.1, 'square', 0.1), 80);
}

export function playVictory() {
  playTone(523, 0.15, 'sine', 0.12);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.12), 120);
  setTimeout(() => playTone(784, 0.15, 'sine', 0.12), 240);
  setTimeout(() => playTone(1047, 0.3, 'sine', 0.15), 360);
}
