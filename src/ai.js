import { ROTATIONS } from './pieces.js';
import {
  COLS,
  cloneBoard,
  simLock,
  simClearLines,
  simCollision,
  dropY,
  evaluateBasic,
  getUniqueRotations,
} from './versus/personaHelpers.js';

const DISCOUNT = 0.7;

export class AI {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.speed = 700;
    this.lastMove = 0;
    this.moves = [];
    this._lastPieceId = -1;
  }

  toggle() {
    this.active = !this.active;
    this.moves = [];
    this._lastPieceId = -1;
  }

  isActive() {
    return this.active;
  }

  setSpeed(ms) {
    this.speed = Math.max(20, ms);
  }

  update(timestamp) {
    if (!this.active || this.game.gameOver || !this.game.started) return;

    // Détecter nouvelle pièce par ID
    const cur = this.game.current;
    if (!cur) return;
    if (cur.id !== this._lastPieceId) {
      this._lastPieceId = cur.id;
      this._plan();
      if (this.moves.length === 0) return;
    }

    // Exécuter les moves en file
    if (this.moves.length > 0 && timestamp - this.lastMove >= this.speed) {
      const action = this.moves.shift();
      const success = action();

      // Si un mouvement échoue, replanifier depuis l'état actuel
      if (success === false) {
        this.moves = [];
        this._plan();
      }

      this.lastMove = timestamp;
    }
  }

  _plan() {
    const { board, current, next, queue } = this.game;
    if (!current) return;

    let bestScore = -Infinity;
    let bestTarget = null;

    const uniqueRots1 = getUniqueRotations(current.name);
    const useLookAhead2 = !!next;
    const uniqueRots2 = useLookAhead2 ? getUniqueRotations(next.name) : null;
    const queue0 = queue?.[0];
    const useLookAhead3 = !!queue0;
    const uniqueRots3 = useLookAhead3 ? getUniqueRotations(queue0.name) : null;

    for (const rot of uniqueRots1) {
      const shape = ROTATIONS[current.name][rot];
      for (let x = -2; x <= COLS; x++) {
        if (simCollision(board, shape, x, 0)) continue;
        const y = dropY(board, shape, x);

        const board1 = cloneBoard(board);
        simLock(board1, shape, x, y, current.name);
        const lines1 = simClearLines(board1);

        if (!useLookAhead2) {
          const score = evaluateBasic(board1, lines1);
          if (score > bestScore) { bestScore = score; bestTarget = { rotation: rot, x }; }
          continue;
        }

        // Look-ahead 2 : évaluer chaque position de la pièce suivante
        let bestSecondScore = -Infinity;
        for (const rot2 of uniqueRots2) {
          const shape2 = ROTATIONS[next.name][rot2];
          for (let x2 = -2; x2 <= COLS; x2++) {
            if (simCollision(board1, shape2, x2, 0)) continue;
            const y2 = dropY(board1, shape2, x2);
            const board2 = cloneBoard(board1);
            simLock(board2, shape2, x2, y2, next.name);
            const lines2 = simClearLines(board2);

            if (!useLookAhead3) {
              const s2 = evaluateBasic(board2, lines2);
              if (s2 > bestSecondScore) bestSecondScore = s2;
              continue;
            }

            // Look-ahead 3 : évaluer chaque position de queue[0] (plage réduite)
            let bestThirdScore = -Infinity;
            for (const rot3 of uniqueRots3) {
              const shape3 = ROTATIONS[queue0.name][rot3];
              for (let x3 = 0; x3 < COLS; x3++) {
                if (simCollision(board2, shape3, x3, 0)) continue;
                const y3 = dropY(board2, shape3, x3);
                const board3 = cloneBoard(board2);
                simLock(board3, shape3, x3, y3, queue0.name);
                const lines3 = simClearLines(board3);
                const s3 = evaluateBasic(board3, lines3);
                if (s3 > bestThirdScore) bestThirdScore = s3;
              }
            }
            const s2 = evaluateBasic(board2, lines2) + DISCOUNT * (bestThirdScore === -Infinity ? 0 : bestThirdScore);
            if (s2 > bestSecondScore) bestSecondScore = s2;
          }
        }

        const score = evaluateBasic(board1, lines1) + DISCOUNT * (bestSecondScore === -Infinity ? 0 : bestSecondScore);
        if (score > bestScore) { bestScore = score; bestTarget = { rotation: rot, x }; }
      }
    }

    if (!bestTarget) return;
    this.moves = this._buildMoves(current, bestTarget);
  }

  _buildMoves(current, target) {
    const moves = [];
    const rots = ((target.rotation - current.rotation) % 4 + 4) % 4;

    // Rotations — chaque move retourne le résultat de rotate()
    for (let i = 0; i < rots; i++) {
      moves.push(() => this.game.rotate());
    }

    // Mouvements horizontaux — recalculés après rotations (wall kicks)
    moves.push(() => {
      const dx = target.x - this.game.current.x;
      if (dx > 0) {
        for (let i = 0; i < dx; i++) this.game.moveRight();
      } else if (dx < 0) {
        for (let i = 0; i < -dx; i++) this.game.moveLeft();
      }
      // Vérifier qu'on a atteint la cible
      return this.game.current.x === target.x;
    });

    // Hard drop
    moves.push(() => { this.game.hardDrop(); return true; });

    return moves;
  }
}
