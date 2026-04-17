import './style.css';
import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { ThemeManager } from './themeManager.js';
import { AI } from './ai.js';
import { ParticleSystem } from './particles.js';
import { TouchControls } from './touch.js';
import * as Sound from './sound.js';

const CELL = 30;
const canvas = document.getElementById('board');
const preview = document.getElementById('preview');
const game = new Game();
const renderer = new Renderer(canvas, preview);
const input = new Input(game);
const themeManager = new ThemeManager(renderer);
const ai = new AI(game);
const particles = new ParticleSystem();

// Sons — callbacks sur le game
game.onLinesCleared = (rows, snapshots, count) => {
  Sound.playClear(count);
  for (let i = 0; i < rows.length; i++) {
    particles.emitRowFromSnapshot(rows[i], snapshots[i], CELL, renderer.theme);
  }
};
game.onLevelUp = (level) => { Sound.playLevelUp(); themeManager.setLevel(level); };
game.onLock = () => Sound.playLock();

// Labels flottants
const floatingLabels = [];
let labelStackY = 0;
function addLabel(text) {
  const yBase = canvas.height / 2 - labelStackY;
  labelStackY += 22;
  floatingLabels.push({ text, t: 0, duration: 60, yBase });
}

game.onTSpin = (lines) => {
  Sound.playTSpin();
  const label = lines === 0 ? 'T-SPIN!' : `T-SPIN ${lines === 1 ? 'SINGLE' : lines === 2 ? 'DOUBLE' : 'TRIPLE'}!`;
  addLabel(label);
};
game.onScoreEarned = (points) => {
  if (points > 0) addLabel(`+${points}`);
};
game.onBackToBack = () => { Sound.playBackToBack(); addLabel('BACK-TO-BACK!'); };
game.onCombo = (n) => { Sound.playCombo(n); addLabel(`COMBO ×${n}`); };
game.onReset = () => { themeManager.setLevel(1); themeManager._levelMode = false; };
game.onGameOver = () => { Sound.playGameOver(); floatingLabels.length = 0; };

// Sons — intercepter les actions de l'input
const origHandleKey = input._handleKey.bind(input);
input._handleKey = (code) => {
  const prevScore = game.score;
  origHandleKey(code);
  if (game.gameOver) return;
  if (code === 'ArrowLeft' || code === 'ArrowRight') Sound.playMove();
  else if (code === 'ArrowUp') { if (game.current) Sound.playRotate(); }
  else if (code === 'Space') Sound.playDrop();
};

// Contrôles tactile
new TouchControls(game, canvas);

// Toggle AI
const aiBtn = document.getElementById('ai-toggle');
aiBtn.addEventListener('click', () => {
  ai.toggle();
  aiBtn.textContent = ai.isActive() ? 'Mode : AI' : 'Mode : Manuel';
  aiBtn.classList.toggle('active', ai.isActive());
});

// Vitesse AI
const speedSlider = document.getElementById('ai-speed');
const speedLabel = document.getElementById('ai-speed-label');
if (speedSlider) {
  speedSlider.addEventListener('input', () => {
    const val = parseInt(speedSlider.value);
    ai.setSpeed(val);
    speedLabel.textContent = val + 'ms';
  });
}

// Toggle son
const muteBtn = document.getElementById('mute-toggle');
if (muteBtn) {
  muteBtn.addEventListener('click', () => {
    const muted = Sound.toggleMute();
    muteBtn.textContent = muted ? 'Son : Off' : 'Son : On';
    muteBtn.classList.toggle('muted', muted);
  });
}

// DAS configurable
const dasDelaySlider = document.getElementById('das-delay');
const dasDelayLabel = document.getElementById('das-delay-label');
const dasRepeatSlider = document.getElementById('das-repeat');
const dasRepeatLabel = document.getElementById('das-repeat-label');
if (dasDelaySlider) {
  // Sync depuis Input (peut avoir chargé depuis localStorage)
  dasDelaySlider.value = input.dasDelay;
  dasDelayLabel.textContent = input.dasDelay + 'ms';
  dasDelaySlider.addEventListener('input', () => {
    input.setDasDelay(parseInt(dasDelaySlider.value));
    dasDelayLabel.textContent = input.dasDelay + 'ms';
  });
}
if (dasRepeatSlider) {
  dasRepeatSlider.value = input.dasRepeat;
  dasRepeatLabel.textContent = input.dasRepeat + 'ms';
  dasRepeatSlider.addEventListener('input', () => {
    input.setDasRepeat(parseInt(dasRepeatSlider.value));
    dasRepeatLabel.textContent = input.dasRepeat + 'ms';
  });
}

function loop(timestamp) {
  if (!game.paused && !game.gameOver && game.started && game.clearingRows.length === 0) ai.update(timestamp);
  game.update(timestamp);
  themeManager.update(timestamp);
  renderer.draw(game);
  if (!game.paused && !game.gameOver) {
    particles.update();
    particles.draw(canvas.getContext('2d'));
  }

  // Labels flottants
  const ctx = canvas.getContext('2d');
  for (let i = floatingLabels.length - 1; i >= 0; i--) {
    const label = floatingLabels[i];
    label.t++;
    const progress = label.t / label.duration;
    if (progress >= 1) { floatingLabels.splice(i, 1); continue; }
    const alpha = 1 - progress;
    const yOff = -progress * 40;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label.text, canvas.width / 2, label.yBase + yOff);
    ctx.restore();
  }
  // Reset stack quand tous les labels sont partis
  if (floatingLabels.length === 0) labelStackY = 0;

  if (game.gameOver) {
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`Score : ${game.score}`, canvas.width / 2, canvas.height / 2 - 15);
    ctx.font = '16px monospace';
    ctx.fillText(`${game.stats.pieces} pièces · ${game.stats.tSpins} T-spins · combo max ×${game.stats.maxCombo}`, canvas.width / 2, canvas.height / 2 + 12);
    const isTouchDevice = 'ontouchstart' in window;
    ctx.fillText(isTouchDevice ? 'Touche pour rejouer' : 'Appuie sur R pour rejouer', canvas.width / 2, canvas.height / 2 + 45);
    ctx.restore();
  } else if (game.paused) {
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSE', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '16px monospace';
    ctx.fillText('Échap ou P pour reprendre', canvas.width / 2, canvas.height / 2 + 20);
    ctx.restore();
  } else if (!game.started) {
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TETRIS', canvas.width / 2, canvas.height / 2 - 60);
    ctx.font = 'bold 16px monospace';
    const isTouchDevice = 'ontouchstart' in window;
    ctx.fillText(isTouchDevice ? 'Touche pour jouer' : 'ESPACE pour jouer', canvas.width / 2, canvas.height / 2);
    ctx.font = '14px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('AI · 10 thèmes · sons · particules', canvas.width / 2, canvas.height / 2 + 40);
    ctx.restore();
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
