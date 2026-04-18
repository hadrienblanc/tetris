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

function createSide(canvas, previewCanvas, seed, accentColor) {
  const game = new Game({
    marathonTarget: 0,          // pas de victoire par objectif en versus
    persistScores: false,       // n'écrase pas le leaderboard solo
    rng: mulberry32(seed),
    difficulty: 'normal',
  });
  const renderer = new Renderer(canvas, previewCanvas, MINIMAL_RENDERER_OPTS);
  const ai = new AI(game);
  const particles = new ParticleSystem();
  const boardCtx = canvas.getContext('2d');
  const boardW = canvas.width || 300;
  const boardH = canvas.height || 600;

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
      // Double onde Tetris sur le board du joueur concerné, teintée de sa couleur
      particles.emitShockwave(boardW / 2, boardH / 2, accentColor, 160, 36);
      particles.emitShockwave(boardW / 2, boardH / 2, '#ffffff', 110, 26);
    } else if (count === 3) {
      particles.emitShockwave(boardW / 2, boardH / 2, '#ffd700', 140, 30);
    } else if (count === 2) {
      particles.emitShockwave(boardW / 2, boardH / 2, accentColor, 100, 22);
    }
  };
  game.onTSpin = (lines) => {
    particles.emitShockwave(boardW / 2, boardH / 2, '#ff00ff', 130, 28);
    if (lines >= 2) particles.emitShockwave(boardW / 2, boardH / 2, '#ffffff', 90, 20);
  };

  return { game, renderer, ai, particles, boardCtx, boardW, boardH };
}

export class VersusMode {
  constructor({ leftCanvas, leftPreview, rightCanvas, rightPreview, gaugeCanvas }) {
    const seedL = newSeed();
    // Forcer une seed droite différente (XOR constante + re-mix)
    const seedR = ((seedL ^ 0x9e3779b9) + 0x85ebca6b) >>> 0;

    this.left = createSide(leftCanvas, leftPreview, seedL, '#00eaff');
    this.right = createSide(rightCanvas, rightPreview, seedR, '#ff2d95');
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
      this._winner = l.score > r.score ? 'P1' : r.score > l.score ? 'P2' : 'TIE';
      this._endTime = performance.now();
    } else if (l.gameOver && !r.gameOver) {
      // Si un des deux est over, on continue mais on anticipe déjà un gagnant potentiel.
      // Le gagnant définitif est annoncé quand les deux sont over OU après un délai.
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
    this.right.renderer.draw(this.right.game);
    this.right.particles.draw(this.right.boardCtx);
    this.gauge.draw({
      p1Score: this.left.game.score,
      p2Score: this.right.game.score,
      p1Lines: this.left.game.lines,
      p2Lines: this.right.game.lines,
      p1Over: this.left.game.gameOver,
      p2Over: this.right.game.gameOver,
      p1Name: 'P1',
      p2Name: 'P2',
      winner: this._winner,
    }, timestamp);
  }

  get started() { return this._running; }
  get bothOver() { return this.left.game.gameOver && this.right.game.gameOver; }
}
