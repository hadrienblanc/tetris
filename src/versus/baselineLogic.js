// Fallback El-Tetris 3-plies — logique identique à _baseline.js.
// Appelée par PersonaRunner quand la persona jette, renvoie une cible
// invalide, ou n'est pas fournie. Pure, main-thread, sans dépendance DOM.

import { ROTATIONS } from '../pieces.js';
import {
  COLS,
  cloneBoard,
  simLock,
  simClearLines,
  simCollision,
  dropY,
  evaluateBasic,
  getUniqueRotations,
} from './personaHelpers.js';

const DISCOUNT = 0.7;

export function baselineDecide(state) {
  const { board, current, next, queue } = state;
  if (!current) return { rotation: 0, x: 3 };

  let bestScore = -Infinity;
  let bestTarget = { rotation: 0, x: 3 };

  const rots1 = getUniqueRotations(current.name);
  const haveNext = !!next;
  const rots2 = haveNext ? getUniqueRotations(next.name) : null;
  const q0 = queue?.[0];
  const haveQ0 = !!q0;
  const rots3 = haveQ0 ? getUniqueRotations(q0.name) : null;

  for (const rot of rots1) {
    const shape = ROTATIONS[current.name][rot];
    for (let x = -2; x <= COLS; x++) {
      if (simCollision(board, shape, x, 0)) continue;
      const y = dropY(board, shape, x);

      const b1 = cloneBoard(board);
      simLock(b1, shape, x, y, current.name);
      const lines1 = simClearLines(b1);

      if (!haveNext) {
        const s = evaluateBasic(b1, lines1);
        if (s > bestScore) { bestScore = s; bestTarget = { rotation: rot, x }; }
        continue;
      }

      let bestSecond = -Infinity;
      for (const rot2 of rots2) {
        const shape2 = ROTATIONS[next.name][rot2];
        for (let x2 = -2; x2 <= COLS; x2++) {
          if (simCollision(b1, shape2, x2, 0)) continue;
          const y2 = dropY(b1, shape2, x2);
          const b2 = cloneBoard(b1);
          simLock(b2, shape2, x2, y2, next.name);
          const lines2 = simClearLines(b2);

          if (!haveQ0) {
            const s2 = evaluateBasic(b2, lines2);
            if (s2 > bestSecond) bestSecond = s2;
            continue;
          }

          let bestThird = -Infinity;
          for (const rot3 of rots3) {
            const shape3 = ROTATIONS[q0.name][rot3];
            for (let x3 = 0; x3 < COLS; x3++) {
              if (simCollision(b2, shape3, x3, 0)) continue;
              const y3 = dropY(b2, shape3, x3);
              const b3 = cloneBoard(b2);
              simLock(b3, shape3, x3, y3, q0.name);
              const lines3 = simClearLines(b3);
              const s3 = evaluateBasic(b3, lines3);
              if (s3 > bestThird) bestThird = s3;
            }
          }
          const s2 = evaluateBasic(b2, lines2) + DISCOUNT * (bestThird === -Infinity ? 0 : bestThird);
          if (s2 > bestSecond) bestSecond = s2;
        }
      }

      const s = evaluateBasic(b1, lines1) + DISCOUNT * (bestSecond === -Infinity ? 0 : bestSecond);
      if (s > bestScore) { bestScore = s; bestTarget = { rotation: rot, x }; }
    }
  }

  return bestTarget;
}

// Construit l'objet state passé aux personas à partir d'un Game et du contexte versus.
// Le board est **cloné** : une persona buggée qui mute son argument ne doit
// pas corrompre le vrai game state. Pas de sandbox pour nous protéger, donc
// on clone défensivement.
export function buildPersonaState(game, selfSide, oppSide) {
  return {
    board: game.board.map(row => [...row]),
    current: game.current ? {
      name: game.current.name,
      rotation: game.current.rotation,
      x: game.current.x,
      y: game.current.y,
      id: game.current.id,
    } : null,
    next: game.next ? { name: game.next.name } : null,
    queue: (game.queue || []).map(p => ({ name: p.name })),
    // Game.hold est une string (nom de pièce), pas un objet — on wrappe.
    hold: game.hold ? { name: game.hold } : null,
    canHold: !!game.canHold,
    self: {
      score: selfSide.game.score,
      level: selfSide.game.level,
      lines: selfSide.game.lines,
      combo: selfSide.game.combo,
      b2bStreak: selfSide.game.b2bStreak,
      leadTime: selfSide.leadTime,
    },
    opp: {
      score: oppSide.game.score,
      level: oppSide.game.level,
      lines: oppSide.game.lines,
      combo: oppSide.game.combo,
      b2bStreak: oppSide.game.b2bStreak,
      leadTime: oppSide.leadTime,
    },
  };
}
