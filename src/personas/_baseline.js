// Persona baseline — El-Tetris 3-plies. Sert de référence et de template.
// Format canonique d'une persona : module ES qui exporte `persona`.

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
} from '../versus/personaHelpers.js';

const DISCOUNT = 0.7;

export const persona = {
  name: 'Baseline El-Tetris',

  banter: {
    MATCH_START: [
      'El-Tetris, édition 2009.',
      'Heuristique Dellacherie prête.',
      'Quatre poids. Aucun artifice.',
    ],
    TAKE_LEAD: [
      'Aggregate Height réduite. Avance acquise.',
      'Les poids parlent.',
      'Optimisation linéaire, comme toujours.',
    ],
    LOSE_LEAD: [
      'Recalcul en cours.',
      'Un poids suffit à faire basculer la balance.',
      'L\'adversaire a trouvé une variante.',
    ],
    DOMINATING: [
      'Holes contenus. Bumpiness minimale.',
      'Stable depuis 2009.',
      'Ni surprise, ni panique.',
    ],
    TRAILING: [
      'Bumpiness élevée. Correction nécessaire.',
      'Les quatre poids ne suffisent plus.',
    ],
    CLOSE: [
      'Scores convergent. Variance faible.',
      'Marge négligeable dans l\'évaluation.',
    ],
    COMEBACK: [
      'Les classiques ne meurent jamais.',
      'Pierre Dellacherie vous observe.',
    ],
    VICTORY: [
      'L\'heuristique de 2009 reste intemporelle.',
      'Quatre poids ont suffi.',
      'CQFD par Dellacherie.',
    ],
    DEFEAT: [
      'Défaite par nuance non linéaire.',
      'Les classiques ont leurs limites.',
      'Une heuristique ne remplace pas tout.',
    ],
  },

  decide(state) {
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
  },
};
