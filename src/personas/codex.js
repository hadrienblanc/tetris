import { ROTATIONS } from '../pieces.js';
import {
  COLS, ROWS,
  dropY, getHeights, countHoles, calcBumpiness,
  evaluateBasic, getUniqueRotations, enumerateDrops,
} from '../versus/personaHelpers.js';

const LINE_CLEAR_BONUS = [0, 1.2, 3.1, 5.2, 8.7];
const EPS = 1e-9;

function getUpcoming(state) {
  const out = [];
  if (state && state.next && state.next.name) out.push(state.next.name);
  if (state && Array.isArray(state.queue)) {
    for (let i = 0; i < state.queue.length; i += 1) {
      const name = state.queue[i] && state.queue[i].name;
      if (name) out.push(name);
    }
  }
  return out;
}

function maxHeight(heights) {
  let m = 0;
  for (let i = 0; i < heights.length; i += 1) {
    if (heights[i] > m) m = heights[i];
  }
  return m;
}

function countDeepHoles(board) {
  let deep = 0;
  for (let x = 0; x < COLS; x += 1) {
    let blocksAbove = 0;
    for (let y = 0; y < ROWS; y += 1) {
      if (board[y][x]) {
        blocksAbove += 1;
      } else if (blocksAbove > 1) {
        deep += blocksAbove - 1;
      }
    }
  }
  return deep;
}

function surfaceVariance(heights) {
  let sum = 0;
  for (let i = 0; i < heights.length; i += 1) sum += heights[i];
  const mean = sum / heights.length;
  let v = 0;
  for (let i = 0; i < heights.length; i += 1) {
    const d = heights[i] - mean;
    v += d * d;
  }
  return v / heights.length;
}

function wellDepth(heights, index) {
  const left = index === 0 ? heights[1] : heights[index - 1];
  const right = index === heights.length - 1 ? heights[heights.length - 2] : heights[index + 1];
  const wall = Math.min(left, right);
  return Math.max(0, wall - heights[index]);
}

function makeContext(state, upcoming) {
  const selfScore = Number.isFinite(state && state.self && state.self.score) ? state.self.score : 0;
  const oppScore = Number.isFinite(state && state.opp && state.opp.score) ? state.opp.score : 0;
  const diff = selfScore - oppScore;
  const trailing = diff < 0;
  const hardChase = diff < -2500;

  return {
    combo: Number.isFinite(state && state.self && state.self.combo) ? state.self.combo : 0,
    iSoon: upcoming[0] === 'I' || upcoming[1] === 'I',
    look1: hardChase ? 0.66 : trailing ? 0.60 : 0.54,
    look2: hardChase ? 0.42 : trailing ? 0.36 : 0.30,
    tetrisBias: hardChase ? 2.1 : trailing ? 1.4 : 0.9,
    holePenalty: hardChase ? 0.58 : trailing ? 0.72 : 0.92,
    deepHolePenalty: hardChase ? 0.03 : trailing ? 0.05 : 0.08,
    bumpPenalty: hardChase ? 0.07 : trailing ? 0.085 : 0.12,
    heightPenalty: hardChase ? 0.17 : trailing ? 0.22 : 0.30,
    dangerPenalty: hardChase ? 0.45 : trailing ? 0.58 : 0.78,
  };
}

function scoreBoard(board, linesCleared, ctx, fast = false) {
  const heights = getHeights(board);
  const holes = countHoles(board);
  const bumpiness = calcBumpiness(heights);
  const maxH = maxHeight(heights);

  let score = evaluateBasic(board, linesCleared);
  score += LINE_CLEAR_BONUS[linesCleared] || 0;

  if (linesCleared === 4) score += ctx.tetrisBias;
  if (linesCleared > 0 && ctx.combo > 0) {
    score += Math.min(4, ctx.combo) * 0.1 * linesCleared;
  }

  score -= holes * ctx.holePenalty;
  score -= bumpiness * ctx.bumpPenalty;
  score -= maxH * ctx.heightPenalty;

  const danger = maxH - 15;
  if (danger > 0) score -= danger * danger * ctx.dangerPenalty;

  const rightWell = wellDepth(heights, COLS - 1);
  if (ctx.iSoon) {
    score += Math.min(6, rightWell) * 0.24;
    if (rightWell >= 4 && linesCleared === 0) score += 0.25;
  } else if (rightWell > 4) {
    score -= (rightWell - 4) * 0.4;
  }

  if (!fast) {
    score -= countDeepHoles(board) * ctx.deepHolePenalty;
    score -= surfaceVariance(heights) * 0.014;
  }

  return score;
}

function keepTopK(top, entry, k) {
  top.push(entry);
  top.sort((a, b) => b.score - a.score);
  if (top.length > k) top.length = k;
}

function sanitizeMove(move) {
  const rotation = Number.isFinite(move && move.rotation) ? (move.rotation | 0) : 0;
  const x = Number.isFinite(move && move.x) ? (move.x | 0) : 0;
  return {
    rotation: Math.max(0, Math.min(3, rotation)),
    x: Math.max(-2, Math.min(9, x)),
  };
}

function fallbackMove(state) {
  const board = state && state.board;
  const current = state && state.current;
  const pieceName = current && current.name;

  if (!board || !pieceName || !ROTATIONS[pieceName]) return { rotation: 0, x: 0 };

  const prefX = Number.isFinite(current.x) ? current.x : 4;
  const rotations = getUniqueRotations(pieceName);
  let best = null;

  for (let i = 0; i < rotations.length; i += 1) {
    const rotation = rotations[i];
    const shape = ROTATIONS[pieceName][rotation];
    if (!shape) continue;

    for (let x = -2; x <= 9; x += 1) {
      const y = dropY(board, shape, x);
      if (!Number.isFinite(y)) continue;
      const dist = Math.abs(x - prefX);

      if (!best || y > best.y || (y === best.y && dist < best.dist)) {
        best = { rotation, x, y, dist };
      }
    }
  }

  if (best) return { rotation: best.rotation, x: best.x };
  return sanitizeMove({ rotation: current.rotation, x: current.x });
}

export const persona = {
  name: 'Codex',
  banter: {
    MATCH_START: [
      'Initialisation. Ligne claire, execution propre.',
      'Run engage. Restons deterministes.',
    ],
    TAKE_LEAD: [
      'Lead acquis. On verrouille.',
      'Avance prise. Aucun bruit.',
    ],
    LOSE_LEAD: [
      'Lead perdu. Recalibrage immediat.',
      'Ecart note. Correction en cours.',
    ],
    DOMINATING: [
      'Controle stable. Le plan tient.',
      'Pipeline propre. Resultat constant.',
    ],
    TRAILING: [
      'Retard mesure. On reduit la dette.',
      'Pas d\'excuse. Juste des clears.',
    ],
    CLOSE: [
      'Fenetre serree. Chaque lock compte.',
      'Match tendu. Garder la surface nette.',
    ],
    COMEBACK: [
      'Retour valide. On continue.',
      'Dette remboursee. Pression maintenue.',
    ],
    VICTORY: [
      'Victoire propre. Build vert.',
      'Resultat livre. GG.',
    ],
    DEFEAT: [
      'Defaite nette. Post mortem ensuite.',
      'Perdu. On corrige et on relance.',
    ],
  },
  decide(state) {
    if (!state || !state.board || !state.current || !state.current.name) {
      return { rotation: 0, x: 0 };
    }

    const rootMoves = enumerateDrops(state.board, state.current.name);
    if (!rootMoves || rootMoves.length === 0) {
      return fallbackMove(state);
    }

    const upcoming = getUpcoming(state);
    const next1 = upcoming[0] || null;
    const next2 = upcoming[1] || null;
    const ctx = makeContext(state, upcoming);
    const doDepth3 = Boolean(next1 && next2 && rootMoves.length <= 26);

    let bestMove = rootMoves[0];
    let bestScore = -Infinity;

    for (let i = 0; i < rootMoves.length; i += 1) {
      const move = rootMoves[i];
      let total = scoreBoard(move.board, move.linesCleared, ctx, false);

      if (next1) {
        const nextMoves = enumerateDrops(move.board, next1);
        if (nextMoves.length > 0) {
          let bestNext = -Infinity;
          const topNext = [];

          for (let j = 0; j < nextMoves.length; j += 1) {
            const nm = nextMoves[j];
            const ns = scoreBoard(nm.board, nm.linesCleared, ctx, true);
            if (ns > bestNext) bestNext = ns;
            if (doDepth3) keepTopK(topNext, { move: nm, score: ns }, 6);
          }

          total += bestNext * ctx.look1;

          if (doDepth3) {
            let bestThird = -Infinity;

            for (let j = 0; j < topNext.length; j += 1) {
              const nm = topNext[j].move;
              const thirdMoves = enumerateDrops(nm.board, next2);
              if (!thirdMoves.length) continue;

              let localBest = -Infinity;
              for (let k = 0; k < thirdMoves.length; k += 1) {
                const tm = thirdMoves[k];
                const ts = scoreBoard(tm.board, tm.linesCleared, ctx, true);
                if (ts > localBest) localBest = ts;
              }

              if (localBest > bestThird) bestThird = localBest;
            }

            if (bestThird > -Infinity) total += bestThird * ctx.look2;
          }
        } else {
          total -= 80;
        }
      }

      if (total > bestScore + EPS) {
        bestScore = total;
        bestMove = move;
      } else if (Math.abs(total - bestScore) <= EPS) {
        if (move.linesCleared > bestMove.linesCleared) {
          bestMove = move;
        } else if (
          move.linesCleared === bestMove.linesCleared &&
          Math.abs(move.x - 4) < Math.abs(bestMove.x - 4)
        ) {
          bestMove = move;
        }
      }
    }

    return sanitizeMove(bestMove);
  },
};
