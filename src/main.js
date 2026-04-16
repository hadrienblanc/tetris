import './style.css';
import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { ThemeManager } from './themeManager.js';
import { AI } from './ai.js';
import { ParticleSystem } from './particles.js';
import { TouchControls } from './touch.js';

const CELL = 30;
const canvas = document.getElementById('board');
const preview = document.getElementById('preview');
const game = new Game();
const renderer = new Renderer(canvas, preview);
const input = new Input(game);
const themeManager = new ThemeManager(renderer);
const ai = new AI(game);
const particles = new ParticleSystem();

// Particules au clear de ligne
game.onLinesCleared = (rows, snapshots) => {
  for (let i = 0; i < rows.length; i++) {
    particles.emitRowFromSnapshot(rows[i], snapshots[i], CELL, renderer.theme);
  }
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
    ctx.fillText('Appuie sur R pour recommencer', canvas.width / 2, canvas.height / 2 + 20);
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
