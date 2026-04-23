// PersonaRunner — exécute une persona (objet JS simple) pour un côté du versus.
//
// Une persona = { name, decide(state), banter }.
// decide() est appelée sur le thread principal, synchrone. Si elle jette ou
// renvoie une cible invalide, on retombe sur baselineDecide. Pas de Worker,
// pas de timeout, pas de sandbox — les personas sont écrites par des LLMs de
// confiance, sur la machine du joueur.

import { baselineDecide, buildPersonaState } from './baselineLogic.js';

const DEFAULT_MOVE_SPEED = 80;

export class PersonaRunner {
  // persona  : objet { name, decide, banter } ou null (→ baseline)
  // side     : objet side de VersusMode (accès game + leadTime)
  // getOpp   : () => side adverse (lazy)
  constructor(persona, side, getOpponent) {
    this.persona = persona || null;
    this.side = side;
    this.getOpponent = getOpponent;
    this.active = false;
    this.speed = DEFAULT_MOVE_SPEED;
    this.lastMove = 0;
    this.moves = [];
    this._lastPieceId = -1;
    this._planForPieceId = -1;
  }

  setSpeed(ms) { this.speed = Math.max(20, ms); }
  isActive()   { return this.active; }

  update(timestamp) {
    const game = this.side.game;
    if (!this.active || game.gameOver || !game.started) return;

    const cur = game.current;
    if (!cur) return;

    // Nouvelle pièce OU replan demandé (ok=false → _planForPieceId=-1).
    // OR pour couvrir les deux cas : sinon un replan same-piece n'est jamais
    // relancé parce que _lastPieceId reste égal à cur.id.
    if (cur.id !== this._lastPieceId || this._planForPieceId !== cur.id) {
      this._lastPieceId = cur.id;
      this._planForPieceId = cur.id;
      this._plan(cur.id);
    }

    if (this.moves.length > 0 && timestamp - this.lastMove >= this.speed) {
      const ok = this.moves.shift()();
      if (ok === false) {
        // Move invalide (board a dérivé entre plan et exécution) → replan.
        this.moves = [];
        this._planForPieceId = -1;
      }
      this.lastMove = timestamp;
    }
  }

  _plan(pieceId) {
    const state = buildPersonaState(this.side.game, this.side, this.getOpponent());

    let target = null;
    if (this.persona && typeof this.persona.decide === 'function') {
      try { target = this.persona.decide(state); }
      catch (e) { console.warn(`[persona ${this.persona.name}] decide threw:`, e); }
    }
    target = this._sanitize(target) || this._sanitize(baselineDecide(state)) || { rotation: 0, x: 3 };

    const game = this.side.game;
    if (!game.current || game.current.id !== pieceId) return; // pièce changée
    this.moves = this._buildMoves(game.current, target);
  }

  // Valide la cible et clamp. Une persona qui renvoie n'importe quoi (NaN,
  // Infinity, string) est ignorée → fallback baseline.
  // Plage x : les pièces les plus larges (I horizontale = 4 cases) débutent
  // légitimement à x=-2 quand elles dépassent à gauche, et les plus étroites
  // (I verticale dans une grille 4×4) peuvent aller jusqu'à x=9. On accepte
  // [-2, 9] — au-delà c'est forcément du garbage.
  _sanitize(target) {
    if (!target) return null;
    const { rotation, x } = target;
    if (!Number.isFinite(rotation) || !Number.isInteger(rotation)) return null;
    if (!Number.isFinite(x) || !Number.isInteger(x)) return null;
    if (x < -2 || x > 9) return null;
    return { rotation: ((rotation % 4) + 4) % 4, x };
  }

  _buildMoves(current, target) {
    const moves = [];
    const rots = ((target.rotation - current.rotation) % 4 + 4) % 4;
    for (let i = 0; i < rots; i++) moves.push(() => this.side.game.rotate());
    moves.push(() => {
      const cur = this.side.game.current;
      if (!cur) return false;
      const dx = target.x - cur.x;
      if (dx > 0) for (let i = 0; i < dx; i++) this.side.game.moveRight();
      else if (dx < 0) for (let i = 0; i < -dx; i++) this.side.game.moveLeft();
      return this.side.game.current.x === target.x;
    });
    moves.push(() => { this.side.game.hardDrop(); return true; });
    return moves;
  }

  dispose() {
    this.moves = [];
    this.active = false;
  }
}
