// Son synthétisés via Web Audio API — zéro dépendance externe
let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

let muted = false;

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function playTone(freq, duration, type = 'square', volume = 0.1) {
  if (muted) return;
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch { /* AudioContext pas disponible */ }
}

export function playMove() {
  playTone(200, 0.05, 'square', 0.06);
}

export function playRotate() {
  playTone(300, 0.08, 'square', 0.08);
}

export function playDrop() {
  playTone(150, 0.15, 'triangle', 0.12);
}

export function playLock() {
  playTone(180, 0.1, 'triangle', 0.08);
}

export function playClear(count) {
  // Plus de lignes = plus aigu et plus long
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
