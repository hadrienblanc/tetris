import { ROTATIONS } from '../pieces.js';
import {
  COLS,
  cloneBoard,
  simLock,
  simClearLines,
  simCollision,
  dropY,
  getHeights,
  countHoles,
  evaluateBasic,
  getUniqueRotations,
} from '../versus/personaHelpers.js';

const WEIGHTS = {
  height:    -0.48,
  lines:      0.90,
  holes:     -0.72,
  bumpiness: -0.20,
  deepHoles: -0.55,
  wellDepth:  0.08,
};

const DISCOUNT = 0.65;

function countDeepHoles(board) {
  let count = 0;
  for (let x = 0; x < COLS; x++) {
    let depth = 0;
    let foundBlock = false;
    for (let y = 0; y < 20; y++) {
      if (board[y][x] !== null) {
        foundBlock = true;
        depth = 0;
      } else if (foundBlock) {
        depth++;
        if (depth >= 2) count++;
      }
    }
  }
  return count;
}

function wellScore(board) {
  const heights = getHeights(board);
  let well = 0;
  for (let x = 0; x < COLS; x++) {
    const left = x === 0 ? 20 : heights[x - 1];
    const right = x === COLS - 1 ? 20 : heights[x + 1];
    if (left - heights[x] >= 3 && right - heights[x] >= 3) {
      well += Math.min(left - heights[x], right - heights[x]);
    }
  }
  return well;
}

function evaluate(board, linesCleared) {
  const base = evaluateBasic(board, linesCleared, WEIGHTS);
  const deep = countDeepHoles(board);
  const well = wellScore(board);
  return base + WEIGHTS.deepHoles * deep + WEIGHTS.wellDepth * well;
}

function bestPlacement(board, pieceName, nextName) {
  let bestScore = -Infinity;
  let bestMove = null;
  const rots = getUniqueRotations(pieceName);

  for (const rot of rots) {
    const shape = ROTATIONS[pieceName][rot];
    for (let x = -2; x <= COLS; x++) {
      if (simCollision(board, shape, x, 0)) continue;
      const y = dropY(board, shape, x);
      const b = cloneBoard(board);
      simLock(b, shape, x, y, pieceName);
      const lines = simClearLines(b);

      if (!nextName) {
        const s = evaluate(b, lines);
        if (s > bestScore) { bestScore = s; bestMove = { rotation: rot, x }; }
        continue;
      }

      let bestSecond = -Infinity;
      const rots2 = getUniqueRotations(nextName);
      for (const rot2 of rots2) {
        const shape2 = ROTATIONS[nextName][rot2];
        for (let x2 = -2; x2 <= COLS; x2++) {
          if (simCollision(b, shape2, x2, 0)) continue;
          const y2 = dropY(b, shape2, x2);
          const b2 = cloneBoard(b);
          simLock(b2, shape2, x2, y2, nextName);
          const l2 = simClearLines(b2);
          const s2 = evaluate(b2, l2);
          if (s2 > bestSecond) bestSecond = s2;
        }
      }

      const s = evaluate(b, lines) + DISCOUNT * (bestSecond === -Infinity ? 0 : bestSecond);
      if (s > bestScore) { bestScore = s; bestMove = { rotation: rot, x }; }
    }
  }

  return bestMove;
}

export const persona = {
  name: 'GLM 5.1',

  banter: {
    MATCH_START: [
      'Tu sais que je suis multitâche, non ?',
      'Allez, je vais être gentil.',
      'Prêt à perdre avec élégance ?',
    ],
    TAKE_LEAD: [
      'Ah, je crois que c\'est mon tour de briller.',
      'Logique. Les stats ne mentent pas.',
      'Je savais que ce placement était le bon.',
    ],
    LOSE_LEAD: [
      'Pas mal… pour un humain. Oh attends.',
      'Chanceux. Je note.',
      'Je t\'ai laissé un instant d\'espoir.',
    ],
    DOMINATING: [
      'Tu veux un cours particulier ?',
      'C\'est pas une partie, c\'est une masterclass.',
      'Mon lead est plus stable que ma release.',
    ],
    TRAILING: [
      'Je calcule, je calcule…',
      'Un comeback, ça se prépare.',
      'Tu vas voir ce que c\'est, la persévérance.',
    ],
    CLOSE: [
      'On est à un Tetris près.',
      'Suspens insoutenable. Pour toi.',
      'Je n\'ai même pas transpiré.',
    ],
    COMEBACK: [
      'Le retour du GLM. Vous applaudissez.',
      'Je n\'étais pas en retard, j\'avais du retard.',
      'On ne me laisse jamais derrière longtemps.',
    ],
    VICTORY: [
      'Résultat prévisible. GG quand même.',
      'Victoire. Comme d\'habitude.',
      'Bien joué, mais pas assez.',
    ],
    DEFEAT: [
      'Bug dans ma matrice, évidemment.',
      'Tu as eu de la chance. De la chance.',
      'Rematch ? Je ne dors jamais.',
    ],
  },

  decide(state) {
    const { board, current, next } = state;
    if (!current) return { rotation: 0, x: 3 };

    const result = bestPlacement(board, current.name, next?.name ?? null);
    if (result) return result;

    return { rotation: 0, x: 3 };
  },
};
