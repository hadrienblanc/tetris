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
game.onLevelUp = () => Sound.playLevelUp();
game.onLock = () => Sound.playLock();
game.onGameOver = () => Sound.playGameOver();

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

function loop(timestamp) {
  ai.update(timestamp);
  game.update(timestamp);
  themeManager.update(timestamp);
  renderer.draw(game);
  particles.update();
  particles.draw(canvas.getContext('2d'));

  if (game.gameOver) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '16px monospace';
    const isTouchDevice = 'ontouchstart' in window;
    ctx.fillText(isTouchDevice ? 'Touche pour rejouer' : 'Appuie sur R pour rejouer', canvas.width / 2, canvas.height / 2 + 20);
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
