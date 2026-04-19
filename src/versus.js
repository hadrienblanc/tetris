// Mode versus : orchestre deux instances Game + deux AI + deux Renderer (minimaux)
// autour d'une ScoreGauge centrale. Chaque côté a sa propre séquence de pièces (RNG seed).

import { Game } from './game.js';
import { AI } from './ai.js';
import { Renderer } from './renderer.js';
import { ScoreGauge } from './scoreGauge.js';
import { ParticleSystem } from './particles.js';
import { mulberry32 } from './rng.js';

const CELL = 30;

const MINIMAL_RENDERER_OPTS = {
  holdCanvas: null,
  queueCanvases: [],
  scoreEl: null,
  highScoreEl: null,
  levelEl: null,
  linesEl: null,
  comboEl: null,
  comboDisplay: null,
  themeNameEl: null,
  applyBodyTheme: false,
};

function newSeed() {
  return (Math.random() * 0xffffffff) >>> 0;
}

function createSide(canvas, previewCanvas, seed, accentColor, hooks = {}) {
  const game = new Game({
    marathonTarget: 0,           // pas de victoire par objectif en versus
    persistScores: false,        // n'écrase pas le leaderboard solo
    levelCap: Infinity,          // pas de limite de niveau en versus
    rng: mulberry32(seed),
    difficulty: 'normal',
  });
  const renderer = new Renderer(canvas, previewCanvas, MINIMAL_RENDERER_OPTS);
  const ai = new AI(game);
  const particles = new ParticleSystem();
  const boardCtx = canvas.getContext('2d');
  const boardW = canvas.width || 300;
  const boardH = canvas.height || 600;

  const side = { game, renderer, ai, particles, boardCtx, boardW, boardH, accentColor, levelUpBanner: null };

  // Hook les effets visuels sur le game
  game.onLock = (cells, pieceName) => {
    const theme = renderer.theme;
    if (!theme || !cells?.length) return;
    const color = theme.cells[pieceName] || '#fff';
    particles.emitLock(cells, CELL, color);
  };
  game.onLinesCleared = (rows, snapshots, count) => {
    for (let i = 0; i < rows.length; i++) {
      particles.emitRowFromSnapshot(rows[i], snapshots[i], CELL, renderer.theme);
    }
    if (count === 4) {
      particles.emitShockwave(boardW / 2, boardH / 2, accentColor, 160, 36);
      particles.emitShockwave(boardW / 2, boardH / 2, '#ffffff', 110, 26);
    } else if (count === 3) {
      particles.emitShockwave(boardW / 2, boardH / 2, '#ffd700', 140, 30);
    } else if (count === 2) {
      particles.emitShockwave(boardW / 2, boardH / 2, accentColor, 100, 22);
    }
    hooks.onLinesCleared?.(count);
  };
  game.onTSpin = (lines) => {
    particles.emitShockwave(boardW / 2, boardH / 2, '#ff00ff', 130, 28);
    if (lines >= 2) particles.emitShockwave(boardW / 2, boardH / 2, '#ffffff', 90, 20);
    hooks.onTSpin?.(lines);
  };
  game.onLevelUp = (level) => {
    // Bannière XXL + triple onde de choc sur le board du joueur
    side.levelUpBanner = { level, start: performance.now(), duration: 1400 };
    particles.emitShockwave(boardW / 2, boardH / 2, accentColor, 220, 46);
    particles.emitShockwave(boardW / 2, boardH / 2, '#ffffff', 150, 36);
    particles.emitShockwave(boardW / 2, boardH / 2, accentColor, 90, 26);
    hooks.onLevelUp?.(accentColor, level);
  };
  game.onGameOver = () => {
    hooks.onGameOver?.();
  };

  return side;
}

export class VersusMode {
  constructor({ leftCanvas, leftPreview, rightCanvas, rightPreview, gaugeCanvas }) {
    const seedL = newSeed();
    // Forcer une seed droite différente (XOR constante + re-mix)
    const seedR = ((seedL ^ 0x9e3779b9) + 0x85ebca6b) >>> 0;

    // Callbacks publics (branchés depuis main.js — typiquement le commentator & l'ambient)
    this.onAILevelUp = null;        // (accentColor, level, side) => void
    this.onAILinesCleared = null;   // (count, side) => void
    this.onAITSpin = null;          // (lines, side) => void
    this.onAIGameOver = null;       // (side) => void
    this.onMatchStart = null;       // () => void
    this.onMatchEnd = null;         // (winner: 'AI1' | 'AI2' | 'TIE') => void

    const leftHooks = {
      onLevelUp: (color, level) => this.onAILevelUp?.(color, level, 'left'),
      onLinesCleared: (count) => this.onAILinesCleared?.(count, 'left'),
      onTSpin: (lines) => this.onAITSpin?.(lines, 'left'),
      onGameOver: () => this.onAIGameOver?.('left'),
    };
    const rightHooks = {
      onLevelUp: (color, level) => this.onAILevelUp?.(color, level, 'right'),
      onLinesCleared: (count) => this.onAILinesCleared?.(count, 'right'),
      onTSpin: (lines) => this.onAITSpin?.(lines, 'right'),
      onGameOver: () => this.onAIGameOver?.('right'),
    };
    this.left = createSide(leftCanvas, leftPreview, seedL, '#00eaff', leftHooks);
    this.right = createSide(rightCanvas, rightPreview, seedR, '#ff2d95', rightHooks);
    this.gauge = new ScoreGauge(gaugeCanvas);
    this._running = false;
    this._winner = null;
    this._endTime = 0;
    this._aiSpeed = 80;
    this.left.ai.setSpeed(this._aiSpeed);
    this.right.ai.setSpeed(this._aiSpeed);
  }

  start() {
    if (this._running) return;
    this.left.ai.active = true;
    this.right.ai.active = true;
    this.left.game.start();
    this.right.game.start();
    this._running = true;
    this._winner = null;
    this._endTime = 0;
    this.onMatchStart?.();
  }

  reset() {
    // Nouvelles seeds pour une manche unique
    const seedL = newSeed();
    const seedR = ((seedL ^ 0x9e3779b9) + 0x85ebca6b) >>> 0;
    this.left.game.rng = mulberry32(seedL);
    this.right.game.rng = mulberry32(seedR);
    this.left.game.reset();
    this.right.game.reset();

    this.left.ai.active = false;
    this.right.ai.active = false;
    this.left.ai.moves = [];
    this.right.ai.moves = [];
    this.left.ai._lastPieceId = -1;
    this.right.ai._lastPieceId = -1;

    this.left.particles.particles.length = 0;
    this.right.particles.particles.length = 0;
    this.left.particles.shockwaves.length = 0;
    this.right.particles.shockwaves.length = 0;
    this.left.levelUpBanner = null;
    this.right.levelUpBanner = null;

    this.gauge.reset();

    this._running = false;
    this._winner = null;
    this._endTime = 0;
  }

  setAISpeed(ms) {
    this._aiSpeed = ms;
    this.left.ai.setSpeed(ms);
    this.right.ai.setSpeed(ms);
  }

  setTheme(theme) {
    if (!theme) return;
    this.left.renderer.setTheme(theme);
    this.right.renderer.setTheme(theme);
  }

  _updateWinner() {
    if (this._winner) return;
    const l = this.left.game;
    const r = this.right.game;
    if (l.gameOver && r.gameOver) {
      this._winner = l.score > r.score ? 'AI1' : r.score > l.score ? 'AI2' : 'TIE';
      this._endTime = performance.now();
      this.onMatchEnd?.(this._winner);
    }
  }

  // Appelé à chaque frame depuis la boucle principale
  update(timestamp) {
    if (!this._running) return;
    const l = this.left, r = this.right;

    // AI n'agit pas si la partie est bloquée (clear en cours, pause, over, etc.)
    if (!l.game.gameOver && !l.game.paused && l.game.clearingRows.length === 0) {
      l.ai.update(timestamp);
    }
    if (!r.game.gameOver && !r.game.paused && r.game.clearingRows.length === 0) {
      r.ai.update(timestamp);
    }

    l.game.update(timestamp);
    r.game.update(timestamp);

    if (!l.game.gameOver) l.particles.update();
    if (!r.game.gameOver) r.particles.update();

    this._updateWinner();
  }

  draw(timestamp) {
    this.left.renderer.draw(this.left.game);
    this.left.particles.draw(this.left.boardCtx);
    this._drawLevelUpBanner(this.left, timestamp);
    this.right.renderer.draw(this.right.game);
    this.right.particles.draw(this.right.boardCtx);
    this._drawLevelUpBanner(this.right, timestamp);
    this.gauge.draw({
      p1Score: this.left.game.score,
      p2Score: this.right.game.score,
      p1Lines: this.left.game.lines,
      p2Lines: this.right.game.lines,
      p1Level: this.left.game.level,
      p2Level: this.right.game.level,
      p1Over: this.left.game.gameOver,
      p2Over: this.right.game.gameOver,
      p1Name: 'AI 1',
      p2Name: 'AI 2',
      winner: this._winner,
    }, timestamp);
  }

  _drawLevelUpBanner(side, timestamp) {
    const b = side.levelUpBanner;
    if (!b) return;
    const t = (timestamp - b.start) / b.duration;
    if (t >= 1) { side.levelUpBanner = null; return; }
    const ctx = side.boardCtx;
    const w = side.boardW;
    const h = side.boardH;
    // scale-bounce : 0 → 0.2 scale 0.2→1.4, 0.2 → 0.35 scale 1.4→1.0, 0.35+ flat, fade après 0.75
    let scale;
    if (t < 0.2) scale = 0.2 + (t / 0.2) * 1.2;
    else if (t < 0.35) scale = 1.4 - ((t - 0.2) / 0.15) * 0.4;
    else scale = 1.0;
    const alpha = t < 0.75 ? 1 : Math.max(0, 1 - (t - 0.75) / 0.25);
    const shake = t < 0.35 ? Math.sin(t * 80) * 3 * (1 - t / 0.35) : 0;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(w / 2 + shake, h / 2);
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // "LVL UP"
    ctx.font = 'bold 26px monospace';
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.lineWidth = 5;
    ctx.fillStyle = side.accentColor;
    ctx.shadowColor = side.accentColor;
    ctx.shadowBlur = 22;
    ctx.strokeText('LVL UP', 0, -24);
    ctx.fillText('LVL UP', 0, -24);
    // Numéro du niveau
    ctx.font = 'bold 64px monospace';
    ctx.lineWidth = 7;
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 28;
    ctx.strokeText(String(b.level), 0, 26);
    ctx.fillText(String(b.level), 0, 26);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  get started() { return this._running; }
  get bothOver() { return this.left.game.gameOver && this.right.game.gameOver; }
}
