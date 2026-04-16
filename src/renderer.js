import { ROTATIONS as _ROTATIONS } from './pieces.js';

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

    this.holdCanvas = document.getElementById('hold-canvas');
    this.hctx = this.holdCanvas?.getContext('2d');
    if (this.holdCanvas) {
      this.holdCanvas.width = 4 * CELL;
      this.holdCanvas.height = 4 * CELL;
    }

    this.theme = null;
    this.transitionFrom = null;
    this.transitionAlpha = 1;

    // DOM cache
    this._prevScore = -1;
    this._prevLevel = -1;
    this._prevLines = -1;
    this._prevHighScore = -1;
    this._prevCombo = -2;
    this._prevThemeName = '';

    this._scoreEl = document.getElementById('score');
    this._highScoreEl = document.getElementById('high-score');
    this._levelEl = document.getElementById('level');
    this._linesEl = document.getElementById('lines');
    this._comboEl = document.getElementById('combo');
    this._comboDisplay = document.getElementById('combo-display');
    this._themeNameEl = document.getElementById('theme-name');
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
    if (this.holdCanvas) this.holdCanvas.style.borderColor = theme.borderColor;

    const labels = document.querySelectorAll('#next-piece h3, #hold-piece h3');
    labels.forEach(el => el.style.color = theme.labelColor);

    const panel = document.getElementById('score-panel');
    if (panel) panel.style.color = theme.labelColor;
    const spans = document.querySelectorAll('#score-panel span');
    spans.forEach(el => el.style.color = theme.textColor);

    const themeLabel = document.getElementById('theme-label');
    if (themeLabel) {
      themeLabel.style.color = theme.textColor;
      themeLabel.style.borderColor = theme.borderColor;
    }

    if (this._themeNameEl && this._prevThemeName !== theme.name) {
      this._themeNameEl.textContent = theme.name;
      this._prevThemeName = theme.name;
    }
  }

  draw(game) {
    const ctx = this.ctx;
    const { board, current, next } = game;
    const theme = this.theme;
    if (!theme) return;

    this._drawBackground(ctx, theme);

    if (this.transitionFrom && this.transitionAlpha < 1) {
      ctx.globalAlpha = 1 - this.transitionAlpha;
      this._drawBackground(ctx, this.transitionFrom);
      ctx.globalAlpha = 1;
    }

    this._drawGrid(ctx, theme);

    // Batch glow setup
    const hasGlow = theme.glow;
    if (hasGlow) {
      ctx.shadowBlur = theme.glowIntensity || 8;
    }

    // Pièces verrouillées — board stocke le nom de la pièce
    const clearingSet = new Set(game.clearingRows);
    const clearProgress = game.clearProgress;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (board[y][x]) {
          if (clearingSet.has(y)) {
            // Shrink vers le centre + fade-out
            this._drawClearingCell(ctx, x, y, board[y][x], theme, clearProgress);
          } else {
            const color = theme.cells[board[y][x]] || '#888';
            if (hasGlow) ctx.shadowColor = color;
            this._drawCell(ctx, x, y, color, theme, false);
          }
        }
      }
    }

    // Ghost piece
    if (current) {
      const ghostY = game.getGhostY();
      const shape = _ROTATIONS[current.name][current.rotation];
      const color = theme.cells[current.name];
      if (hasGlow) ctx.shadowColor = color;
      ctx.globalAlpha = 0.2;
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            this._drawCell(ctx, current.x + x, ghostY + y, color, theme, false);
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    // Pièce courante
    if (current) {
      const shape = _ROTATIONS[current.name][current.rotation];
      const color = theme.cells[current.name];
      if (hasGlow) ctx.shadowColor = color;
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            this._drawCell(ctx, current.x + x, current.y + y, color, theme, false);
          }
        }
      }
    }

    // Reset shadow après batch
    if (hasGlow) {
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }

    this._drawPreview(next, theme);
    this._drawHold(game.hold, theme);

    // DOM updates — seulement si changé
    if (game.score !== this._prevScore) { this._scoreEl.textContent = game.score; this._prevScore = game.score; }
    if (game.highScore !== this._prevHighScore) { this._highScoreEl.textContent = game.highScore; this._prevHighScore = game.highScore; }
    if (game.level !== this._prevLevel) { this._levelEl.textContent = game.level; this._prevLevel = game.level; }
    if (game.lines !== this._prevLines) { this._linesEl.textContent = game.lines; this._prevLines = game.lines; }
    if (game.combo !== this._prevCombo) {
      this._prevCombo = game.combo;
      if (game.combo > 0) {
        this._comboDisplay.style.display = '';
        this._comboEl.textContent = game.combo;
      } else {
        this._comboDisplay.style.display = 'none';
      }
    }
  }

  _drawClearingCell(ctx, x, y, pieceName, theme, progress) {
    const px = x * CELL;
    const py = y * CELL;
    const color = theme.cells[pieceName] || '#fff';
    const centerX = COLS * CELL / 2;
    const cellCenterX = px + CELL / 2;
    const cellCenterY = py + CELL / 2;

    // Interpoler la position vers le centre de la ligne
    const shrink = 1 - progress;
    const dx = (centerX - cellCenterX) * progress;
    const dy = 0;
    const w = CELL * shrink;
    const h = CELL * shrink;

    if (theme.glow) { ctx.shadowColor = color; ctx.shadowBlur = theme.glowIntensity || 8; }
    ctx.globalAlpha = shrink;
    ctx.fillStyle = color;
    ctx.fillRect(
      cellCenterX + dx - w / 2,
      cellCenterY + dy - h / 2,
      Math.max(0, w),
      Math.max(0, h)
    );
    // Flash blanc initial
    if (progress < 0.3) {
      ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - progress / 0.3)})`;
      ctx.fillRect(
        cellCenterX + dx - w / 2,
        cellCenterY + dy - h / 2,
        Math.max(0, w),
        Math.max(0, h)
      );
    }
    ctx.globalAlpha = 1;
    if (theme.glow) { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; }
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

  _drawCell(ctx, x, y, color, theme, isPreview) {
    const px = x * CELL;
    const py = y * CELL;
    const style = theme.cellStyle;

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
        const len = theme.pixelColors?.length || 1;
        const idx = (((x * 7 + y * 13) % len) + len) % len;
        ctx.fillStyle = theme.pixelColors ? theme.pixelColors[idx] : color;
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
        // Glitch line — seed stable
        if ((x * 31 + y * 17) % 12 === 0) {
          ctx.fillStyle = 'rgba(255,255,0,0.3)';
          ctx.fillRect(px, py + ((x * 3 + y * 7) % CELL), CELL, 1);
        }
        break;

      case 'glass': {
        const prevAlpha = ctx.globalAlpha;
        ctx.globalAlpha = prevAlpha * 0.7;
        ctx.fillStyle = color;
        ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
        ctx.globalAlpha = prevAlpha; // restore exact valeur
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(px + 2, py + 2, CELL - 4, 4);
        break;
      }

      case 'mono':
        ctx.fillStyle = color;
        ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2);
        break;

      case 'candy':
        ctx.fillStyle = color;
        ctx.fillRect(px + 2, py + 2, CELL - 4, CELL - 4);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(px + CELL * 0.35, py + CELL * 0.35, 3, 0, Math.PI * 2);
        ctx.fill();
        break;

      default:
        ctx.fillStyle = color;
        ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
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

    if (theme.glow) {
      ctx.shadowBlur = theme.glowIntensity || 8;
      ctx.shadowColor = color;
    }

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          this._drawCell(ctx, ox + x, oy + y, color, theme, true);
        }
      }
    }

    if (theme.glow) {
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }
  }

  _drawHold(holdName, theme) {
    if (!this.holdCanvas || !this.hctx) return;
    const ctx = this.hctx;
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);

    if (!holdName) return;
    const shape = _ROTATIONS[holdName][0];
    if (!shape || !shape.length) return;

    const color = theme.cells[holdName];
    const ox = Math.floor((4 - shape[0].length) / 2);
    const oy = Math.floor((4 - shape.length) / 2);

    if (theme.glow) {
      ctx.shadowBlur = theme.glowIntensity || 8;
      ctx.shadowColor = color;
    }

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          this._drawCell(ctx, ox + x, oy + y, color, theme, true);
        }
      }
    }

    if (theme.glow) {
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }
  }
}
