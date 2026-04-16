const CELL = 30;

export class Renderer {
  constructor(canvas, previewCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.preview = previewCanvas;
    this.pctx = previewCanvas.getContext('2d');

    this.canvas.width = 10 * CELL;
    this.canvas.height = 20 * CELL;
    this.preview.width = 4 * CELL;
    this.preview.height = 4 * CELL;
  }

  draw(game) {
    const ctx = this.ctx;
    const { board, current, next } = game;

    // Fond
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Grille
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= 10; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, 20 * CELL);
      ctx.stroke();
    }
    for (let y = 0; y <= 20; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(10 * CELL, y * CELL);
      ctx.stroke();
    }

    // Pièces verrouillées
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 10; x++) {
        if (board[y][x]) {
          this._drawCell(ctx, x, y, board[y][x]);
        }
      }
    }

    // Ghost piece
    if (current) {
      const ghostY = game.getGhostY();
      const shape = this._getShape(current);
      ctx.globalAlpha = 0.2;
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            this._drawCell(ctx, current.x + x, ghostY + y, this._getColor(current.name));
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    // Pièce courante
    if (current) {
      const shape = this._getShape(current);
      const color = this._getColor(current.name);
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            this._drawCell(ctx, current.x + x, current.y + y, color);
          }
        }
      }
    }

    // Next piece preview
    this._drawPreview(next);

    // UI
    document.getElementById('score').textContent = game.score;
    document.getElementById('level').textContent = game.level;
    document.getElementById('lines').textContent = game.lines;
  }

  _drawCell(ctx, x, y, color) {
    const px = x * CELL;
    const py = y * CELL;
    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(px + 1, py + 1, CELL - 2, 3);
    ctx.fillRect(px + 1, py + 1, 3, CELL - 2);
  }

  _drawPreview(piece) {
    const ctx = this.pctx;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, this.preview.width, this.preview.height);
    if (!piece) return;

    const rotations = this._getRotations(piece.name);
    const shape = rotations[0];
    if (!shape.length) return;

    const color = this._getColor(piece.name);
    const ox = Math.floor((4 - shape[0].length) / 2);
    const oy = Math.floor((4 - shape.length) / 2);
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          this._drawCell(ctx, ox + x, oy + y, color);
        }
      }
    }
  }
}

// Imports nécessaires pour le renderer
import { PIECES as _PIECES, ROTATIONS as _ROTATIONS } from './pieces.js';

// On attache les helpers au prototype pour éviter de ré-importer
Renderer.prototype._getColor = function(name) { return _PIECES[name]?.color || '#fff'; };
Renderer.prototype._getShape = function(piece) { return _ROTATIONS[piece.name][piece.rotation]; };
Renderer.prototype._getRotations = function(name) { return _ROTATIONS[name]; };
