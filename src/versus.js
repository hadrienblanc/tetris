// Mode versus : orchestre deux instances Game + deux AI + deux Renderer (minimaux)
// autour d'une ScoreGauge centrale. Chaque côté a sa propre séquence de pièces (RNG seed).

import { Game } from './game.js';
import { AI } from './ai.js';
import { Renderer } from './renderer.js';
import { ScoreGauge } from './scoreGauge.js';
import { mulberry32 } from './rng.js';

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

function createSide(canvas, previewCanvas, seed) {
  const game = new Game({
    marathonTarget: 0,          // pas de victoire par objectif en versus
    persistScores: false,       // n'écrase pas le leaderboard solo
    rng: mulberry32(seed),
    difficulty: 'normal',
  });
  const renderer = new Renderer(canvas, previewCanvas, MINIMAL_RENDERER_OPTS);
  const ai = new AI(game);
  return { game, renderer, ai };
}

export class VersusMode {
  constructor({ leftCanvas, leftPreview, rightCanvas, rightPreview, gaugeCanvas }) {
    const seedL = newSeed();
    // Forcer une seed droite différente (XOR constante + re-mix)
    const seedR = ((seedL ^ 0x9e3779b9) + 0x85ebca6b) >>> 0;

    this.left = createSide(leftCanvas, leftPreview, seedL);
    this.right = createSide(rightCanvas, rightPreview, seedR);
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

    this._updateWinner();
  }

  draw(timestamp) {
    this.left.renderer.draw(this.left.game);
    this.right.renderer.draw(this.right.game);
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
