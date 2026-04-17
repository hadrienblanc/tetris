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

    this._queueCanvases = [];
    this._queueCtxs = [];
    for (let i = 1; i <= 2; i++) {
      const c = document.getElementById(`queue-${i}`);
      if (c) {
        c.width = 4 * CELL;
        c.height = 4 * CELL;
        this._queueCanvases.push(c);
        this._queueCtxs.push(c.getContext('2d'));
      }
    }
    this._lastQueueIds = [-1, -1];
    this._queueAnims = [1, 1];

    this._ambientDraw = null;
    this.theme = null;
    this.transitionFrom = null;
    this.transitionAlpha = 1;
    this._previewAnim = 1; // 0→1 animation progress
    this._lastPreviewId = -1;
    this._holdAnim = 1;
    this._lastHoldName = null;
    this._spawnAnim = 1;
    this._lastCurrentId = -1;

    // DOM cache
    this._prevScore = -1;
    this._displayScore = 0;
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

  resetCounters() {
    this._displayScore = 0;
    this._prevScore = -1;
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
    for (const c of this._queueCanvases) c.style.borderColor = theme.borderColor;

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

    // Screen shake
    const shake = game.shakeOffset;
    ctx.save();
    ctx.translate(shake.x, shake.y);

    this._drawBackground(ctx, theme);

    // Ambient effects (particules de fond)
    if (this._ambientDraw) this._ambientDraw(ctx, theme);

    if (this.transitionFrom && this.transitionAlpha < 1) {
      ctx.globalAlpha = 1 - this.transitionAlpha;
      this._drawBackground(ctx, this.transitionFrom);
      ctx.globalAlpha = 1;
    }

    this._drawGrid(ctx, theme, game.level);

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

    // Lock flash overlay
    if (game._lockFlashCells.length > 0 && game.lockFlashProgress < 1) {
      const flashAlpha = 0.5 * (1 - game.lockFlashProgress);
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = '#fff';
      for (const cell of game._lockFlashCells) {
        ctx.fillRect(cell.x * CELL + 1, cell.y * CELL + 1, CELL - 2, CELL - 2);
      }
      ctx.globalAlpha = 1;
    }

    // Ghost piece
    if (current) {
      const ghostY = game.getGhostY();
      const shape = _ROTATIONS[current.name][current.rotation];
      const color = theme.cells[current.name];
      ctx.globalAlpha = 0.15;
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            this._drawCell(ctx, current.x + x, ghostY + y, color, theme, false);
          }
        }
      }
      // Outline dashed
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            ctx.strokeRect(
              (current.x + x) * CELL + 1,
              (ghostY + y) * CELL + 1,
              CELL - 2,
              CELL - 2
            );
          }
        }
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // Pièce courante
    if (current) {
      if (current.id !== this._lastCurrentId) {
        this._lastCurrentId = current.id;
        this._spawnAnim = 0;
      }
      if (this._spawnAnim < 1) this._spawnAnim = Math.min(1, this._spawnAnim + 0.18);

      const shape = _ROTATIONS[current.name][current.rotation];
      const color = theme.cells[current.name];
      if (hasGlow) ctx.shadowColor = color;

      // Scale-in animation
      const scale = this._spawnAnim;
      const alpha = Math.max(0.4, scale);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (scale < 1) {
        const cx = (current.x + shape[0].length / 2) * CELL;
        const cy = (current.y + shape.length / 2) * CELL;
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);
      }

      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            this._drawCell(ctx, current.x + x, current.y + y, color, theme, false);
          }
        }
      }

      ctx.restore();
    }

    // Hard drop trail
    if (game.dropTrail.length > 0) {
      const tp = game.trailProgress;
      const alpha = 1 - tp;
      ctx.globalAlpha = alpha * 0.4;
      const trailName = game._trailPieceName || (current ? current.name : null);
      for (const cell of game.dropTrail) {
        const color = trailName ? (theme.cells[trailName] || '#fff') : '#fff';
        if (hasGlow) { ctx.shadowColor = color; ctx.shadowBlur = theme.glowIntensity || 8; }
        ctx.fillStyle = color;
        ctx.fillRect(cell.x * CELL + 1, cell.y * CELL + 1, CELL - 2, CELL - 2);
      }
      ctx.globalAlpha = 1;
      if (hasGlow) { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; }
    }

    // Reset shadow après batch
    if (hasGlow) {
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }

    if (next && next.id !== this._lastPreviewId) {
      this._lastPreviewId = next.id;
      this._previewAnim = 0;
    }
    if (this._previewAnim < 1) this._previewAnim = Math.min(1, this._previewAnim + 0.15);
    this._drawPreview(next, theme);
    if (game.hold !== this._lastHoldName) {
      this._lastHoldName = game.hold;
      if (game.hold) this._holdAnim = 0;
    }
    if (this._holdAnim < 1) this._holdAnim = Math.min(1, this._holdAnim + 0.15);
    this._drawHold(game.hold, theme);
    this._drawQueue(game.queue, theme);

    // DOM updates — score animé
    if (game.score !== this._prevScore) { this._prevScore = game.score; }
    if (this._displayScore !== game.score) {
      const diff = game.score - this._displayScore;
      this._displayScore += Math.ceil(diff * 0.3) || diff;
      if (Math.abs(this._displayScore - game.score) < 2) this._displayScore = game.score;
    }
    this._scoreEl.textContent = this._displayScore;
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

    ctx.restore();

    // Border glow pendant line clear
    if (game.clearingRows.length > 0) {
      const borderColor = theme.borderColor || '#fff';
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(1, 1, this.canvas.width - 2, this.canvas.height - 2);
      ctx.restore();
    }

    // Flash level up
    const flash = game.flashProgress;
    if (flash > 0) {
      const accent = theme.cells?.T || '#fff';
      ctx.globalAlpha = flash * 0.3;
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.globalAlpha = 1;
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

  _drawGrid(ctx, theme, level) {
    // Pulse subtil : opacité varie entre 0.3 et 0.7, vitesse augmente avec le level
    const pulse = 0.5 + 0.2 * Math.sin(Date.now() * 0.002 * (1 + (level || 1) * 0.1));
    ctx.strokeStyle = theme.gridColor;
    ctx.globalAlpha = pulse;
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
    ctx.globalAlpha = 1;
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

  _centerOffsets(shape, canvasSize) {
    let minY = shape.length, maxY = 0, minX = shape[0].length, maxX = 0;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
    const pieceW = maxX - minX + 1;
    const pieceH = maxY - minY + 1;
    return {
      ox: Math.floor((canvasSize - pieceW) / 2) - minX,
      oy: Math.floor((canvasSize - pieceH) / 2) - minY,
    };
  }

  _drawPreview(piece, theme) {
    const ctx = this.pctx;
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, this.preview.width, this.preview.height);

    if (!piece) return;
    const shape = _ROTATIONS[piece.name][0];
    if (!shape || !shape.length) return;

    const color = theme.cells[piece.name];
    const { ox, oy } = this._centerOffsets(shape, 4);

    // Animation scale-in
    const scale = this._previewAnim;
    const alpha = Math.max(0.3, scale);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (scale < 1) {
      const cx = this.preview.width / 2;
      const cy = this.preview.height / 2;
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);
    }

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
    ctx.restore();
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
    const { ox, oy } = this._centerOffsets(shape, 4);

    // Animation scale-in
    const scale = this._holdAnim;
    const alpha = Math.max(0.3, scale);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (scale < 1) {
      const cx = this.holdCanvas.width / 2;
      const cy = this.holdCanvas.height / 2;
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);
    }

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
    ctx.restore();
  }

  _drawQueue(queue, theme) {
    for (let i = 0; i < this._queueCanvases.length; i++) {
      const canvas = this._queueCanvases[i];
      if (!canvas) continue;
      const ctx = this._queueCtxs[i];
      const piece = queue?.[i];
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!piece) continue;

      if (piece.id !== this._lastQueueIds[i]) {
        this._lastQueueIds[i] = piece.id;
        this._queueAnims[i] = 0;
      }
      if (this._queueAnims[i] < 1) this._queueAnims[i] = Math.min(1, this._queueAnims[i] + 0.15);

      const shape = _ROTATIONS[piece.name][0];
      if (!shape || !shape.length) continue;
      const color = theme.cells[piece.name];
      const { ox, oy } = this._centerOffsets(shape, 4);

      const scale = this._queueAnims[i];
      const alpha = Math.max(0.4, scale);
      ctx.save();
      ctx.globalAlpha = alpha * 0.7;
      if (scale < 1) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);
      }

      if (theme.glow) { ctx.shadowBlur = theme.glowIntensity || 8; ctx.shadowColor = color; }
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) this._drawCell(ctx, ox + x, oy + y, color, theme, true);
        }
      }
      if (theme.glow) { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; }
      ctx.restore();
    }
  }
}
