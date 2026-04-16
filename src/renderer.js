import { PIECES as _PIECES, ROTATIONS as _ROTATIONS } from './pieces.js';

const CELL = 30;
const COLS = 10;
const ROWS = 20;

export class Renderer {
  constructor(canvas, previewCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.preview = previewCanvas;
    this.pctx = previewCanvas.getContext('2d');

    this.canvas.width = COLS * CELL;
    this.canvas.height = ROWS * CELL;
    this.preview.width = 4 * CELL;
    this.preview.height = 4 * CELL;

    this.theme = null;
    this.transitionFrom = null;
    this.transitionAlpha = 1;
  }

  setTheme(theme) {
    this.theme = theme;
    this._applyBodyTheme(theme);
  }

  setTransition(from, to, progress) {
    this.transitionFrom = from;
    this.transitionAlpha = progress;
  }

  _applyBodyTheme(theme) {
    document.body.style.background = theme.bg;
    document.body.style.color = theme.textColor;
    this.canvas.style.borderColor = theme.borderColor;
    this.preview.style.borderColor = theme.borderColor;

    const labels = document.querySelectorAll('#next-piece h3');
    labels.forEach(el => el.style.color = theme.labelColor);

    const panel = document.getElementById('score-panel');
    if (panel) panel.style.color = theme.labelColor;
    const spans = document.querySelectorAll('#score-panel span');
    spans.forEach(el => el.style.color = theme.textColor);

    const themeLabel = document.getElementById('theme-name');
    if (themeLabel) themeLabel.textContent = theme.name;
  }

  draw(game) {
    const ctx = this.ctx;
    const { board, current, next } = game;
    const theme = this.theme;
    if (!theme) return;

    this._drawBackground(ctx, theme);

    // Transition overlay
    if (this.transitionFrom && this.transitionAlpha < 1) {
      ctx.globalAlpha = 1 - this.transitionAlpha;
      this._drawBackground(ctx, this.transitionFrom);
      ctx.globalAlpha = 1;
    }

    this._drawGrid(ctx, theme);

    // Pièces verrouillées
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (board[y][x]) {
          this._drawCell(ctx, x, y, board[y][x], theme);
        }
      }
    }

    // Ghost piece
    if (current) {
      const ghostY = game.getGhostY();
      const shape = _ROTATIONS[current.name][current.rotation];
      const color = theme.cells[current.name];
      ctx.globalAlpha = 0.2;
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            this._drawCell(ctx, current.x + x, ghostY + y, color, theme);
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    // Pièce courante
    if (current) {
      const shape = _ROTATIONS[current.name][current.rotation];
      const color = theme.cells[current.name];
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            this._drawCell(ctx, current.x + x, current.y + y, color, theme);
          }
        }
      }
    }

    this._drawPreview(next, theme);

    document.getElementById('score').textContent = game.score;
    document.getElementById('level').textContent = game.level;
    document.getElementById('lines').textContent = game.lines;
  }

  _drawBackground(ctx, theme) {
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  _drawGrid(ctx, theme) {
    ctx.strokeStyle = theme.gridColor;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, ROWS * CELL);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(COLS * CELL, y * CELL);
      ctx.stroke();
    }
  }

  _drawCell(ctx, x, y, color, theme) {
    const px = x * CELL;
    const py = y * CELL;
    const style = theme.cellStyle;

    // Glow
    if (theme.glow) {
      ctx.shadowBlur = theme.glowIntensity || 8;
      ctx.shadowColor = color;
    }

    switch (style) {
      case 'neon':
        ctx.fillStyle = color;
        ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(px + 2, py + 2, CELL - 4, 2);
        ctx.fillRect(px + 2, py + 2, 2, CELL - 4);
        break;

      case 'flat':
        ctx.fillStyle = color;
        ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
        break;

      case 'pixel': {
        const palette = theme.pixelColors || [color];
        ctx.fillStyle = palette[Math.floor(Math.random() * palette.length)];
        ctx.fillRect(px, py, CELL, CELL);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(px, py, CELL, 1);
        ctx.fillRect(px, py, 1, CELL);
        break;
      }

      case 'cyber':
        ctx.fillStyle = color;
        ctx.fillRect(px, py, CELL, CELL);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(px, py + CELL - 2, CELL, 2);
        ctx.fillRect(px + CELL - 2, py, 2, CELL);
        // Glitch line aléatoire
        if (Math.random() < 0.08) {
          ctx.fillStyle = 'rgba(255,255,0,0.4)';
          ctx.fillRect(px, py + Math.random() * CELL, CELL, 1);
        }
        break;

      case 'glass':
        ctx.fillStyle = color;
        ctx.globalAlpha = (ctx.globalAlpha || 1) * 0.7;
        ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(px + 2, py + 2, CELL - 4, 4);
        break;

      case 'mono':
        ctx.fillStyle = color;
        ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2);
        break;

      case 'candy':
        ctx.fillStyle = color;
        ctx.fillRect(px + 2, py + 2, CELL - 4, CELL - 4);
        // Brilliance
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(px + CELL * 0.35, py + CELL * 0.35, 3, 0, Math.PI * 2);
        ctx.fill();
        break;

      default:
        ctx.fillStyle = color;
        ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
    }

    // Reset shadow
    if (theme.glow) {
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }
  }

  _drawPreview(piece, theme) {
    const ctx = this.pctx;
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, this.preview.width, this.preview.height);

    if (!piece) return;
    const shape = _ROTATIONS[piece.name][0];
    if (!shape || !shape.length) return;

    const color = theme.cells[piece.name];
    const ox = Math.floor((4 - shape[0].length) / 2);
    const oy = Math.floor((4 - shape.length) / 2);
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          this._drawCell(ctx, ox + x, oy + y, color, theme);
        }
      }
    }
  }
}
