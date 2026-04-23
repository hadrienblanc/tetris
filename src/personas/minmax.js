// src/personas/MinMax.js
import { ROTATIONS } from '../pieces.js';
import {
  COLS, ROWS,
  cloneBoard, simLock, simClearLines, simCollision,
  dropY, getHeights, countHoles, calcBumpiness,
  evaluateBasic, getUniqueRotations, enumerateDrops,
  ELTETRIS_WEIGHTS,
} from '../versus/personaHelpers.js';

const DISCOUNT = 0.7;

const WEIGHTS = {
  height:    -0.55,
  lines:      0.85,
  holes:     -0.42,
  bumpiness: -0.20,
};

function evaluateDeep(board, linesCleared) {
  const heights = getHeights(board);
  const aggHeight = heights.reduce((a, b) => a + b, 0);
  const holes = countHoles(board);
  const bump = calcBumpiness(heights);
  let score = WEIGHTS.height    * aggHeight
           + WEIGHTS.lines     * linesCleared
           + WEIGHTS.holes     * holes
           + WEIGHTS.bumpiness * bump;
  for (let x = 0; x < COLS; x++) {
    let blockFound = false;
    let holeDepth = 0;
    for (let y = 0; y < ROWS; y++) {
      if (board[y][x] !== null) { blockFound = true; }
      else if (blockFound) { holeDepth++; }
    }
    if (holeDepth > 3) score -= holeDepth * 0.15;
  }
  return score;
}

export const persona = {
  name: 'MiniMax M2.7',
  banter: {
    MATCH_START: [
      'Analyse en cours.',
      'MinMax prêt.',
      'Configuration optimale.',
    ],
    TAKE_LEAD: [
      'Avance acquise.',
      'Écart significatif.',
      'Domination confirmée.',
    ],
    LOSE_LEAD: [
      'Écart en contraction.',
      'Correction de trajectoire.',
      'Reprise en vue.',
    ],
    DOMINATING: [
      'Marge confortable.',
      'Contrôle total.',
      'Avance stable.',
    ],
    TRAILING: [
      'Rattrapage actif.',
      'Optimisation en cours.',
      'Phase critique.',
    ],
    CLOSE: [
      'Équilibre stratégique.',
      'Match neutre.',
      'Tension maximale.',
    ],
    COMEBACK: [
      'Reprise confirmée.',
      'Correction en cours.',
      'Inversion de tendance.',
    ],
    VICTORY: [
      'Analyse terminée.',
      'Résultat optimal.',
      'Partie maîtrisée.',
    ],
    DEFEAT: [
      'Échec de la stratégie.',
      'Revue nécessaire.',
      'Erreur de calcul.',
    ],
  },

  decide(state) {
    const { board, current } = state;
    if (!current) return { rotation: 0, x: 3 };

    const drops = enumerateDrops(board, current.name);
    if (drops.length === 0) return { rotation: 0, x: 3 };

    let bestScore = -Infinity;
    let bestDrop = drops[0];

    const { next, queue } = state;
    const haveNext = !!next;
    const haveQ0 = queue?.[0] && queue[0].name;

    for (const drop of drops) {
      const { rotation, x, y, board: b1, linesCleared: l1 } = drop;

      if (!haveNext) {
        const s = evaluateDeep(b1, l1);
        if (s > bestScore) { bestScore = s; bestDrop = drop; }
        continue;
      }

      let bestSecond = -Infinity;
      for (const rot2 of getUniqueRotations(next.name)) {
        const shape2 = ROTATIONS[next.name][rot2];
        for (let x2 = -2; x2 <= COLS; x2++) {
          if (simCollision(b1, shape2, x2, 0)) continue;
          const y2 = dropY(b1, shape2, x2);
          const b2 = cloneBoard(b1);
          simLock(b2, shape2, x2, y2, next.name);
          const l2 = simClearLines(b2);

          if (!haveQ0) {
            const s2 = evaluateDeep(b2, l2);
            if (s2 > bestSecond) bestSecond = s2;
            continue;
          }

          let bestThird = -Infinity;
          for (const rot3 of getUniqueRotations(queue[0].name)) {
            const shape3 = ROTATIONS[queue[0].name][rot3];
            for (let x3 = -2; x3 <= COLS; x3++) {
              if (simCollision(b2, shape3, x3, 0)) continue;
              const y3 = dropY(b2, shape3, x3);
              const b3 = cloneBoard(b2);
              simLock(b3, shape3, x3, y3, queue[0].name);
              const l3 = simClearLines(b3);
              const s3 = evaluateDeep(b3, l3);
              if (s3 > bestThird) bestThird = s3;
            }
          }
          const s2 = evaluateDeep(b2, l2) + DISCOUNT * (bestThird === -Infinity ? 0 : bestThird);
          if (s2 > bestSecond) bestSecond = s2;
        }
      }

      const s = evaluateDeep(b1, l1) + DISCOUNT * (bestSecond === -Infinity ? 0 : bestSecond);
      if (s > bestScore) { bestScore = s; bestDrop = drop; }
    }

    return { rotation: bestDrop.rotation, x: bestDrop.x };
  },
};
