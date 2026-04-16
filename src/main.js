import './style.css';
import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { Input } from './input.js';

const canvas = document.getElementById('board');
const preview = document.getElementById('preview');
const game = new Game();
const renderer = new Renderer(canvas, preview);
const input = new Input(game);

function loop(timestamp) {
  game.update(timestamp);
  renderer.draw(game);

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
