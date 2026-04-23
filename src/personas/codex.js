import { ROTATIONS } from '../pieces.js';
import {
  COLS, ROWS,
  cloneBoard, simLock, simClearLines, simCollision,
  dropY, getHeights, countHoles, calcBumpiness,
  evaluateBasic, getUniqueRotations, enumerateDrops,
  ELTETRIS_WEIGHTS,
} from '../versus/personaHelpers.js';

const SEARCH_DECAY = 0.42;
const NEXT_DECAY = 0.18;
const DANGER_HEIGHT = 15;

function filledCells(board) {
  let count = 0;
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (board[y][x]) count += 1;
    }
  }
  return count;
}

function columnTransitions(board) {
  let total = 0;
  for (let x = 0; x < COLS; x += 1) {
    let prev = true;
    for (let y = 0; y < ROWS; y += 1) {
      const filled = Boolean(board[y][x]);
      if (filled !== prev) total += 1;
      prev = filled;
    }
    if (!prev) total += 1;
  }
  return total;
}

function rowTransitions(board) {
  let total = 0;
  for (let y = 0; y < ROWS; y += 1) {
    let prev = true;
    for (let x = 0; x < COLS; x += 1) {
      const filled = Boolean(board[y][x]);
      if (filled !== prev) total += 1;
      prev = filled;
    }
    if (!prev) total += 1;
  }
  return total;
}

function wells(heights) {
  let total = 0;
  for (let x = 0; x < COLS; x += 1) {
    const left = x === 0 ? ROWS : heights[x - 1];
    const right = x === COLS - 1 ? ROWS : heights[x + 1];
    const depth = Math.min(left, right) - heights[x];
    if (depth > 0) total += (depth * (depth + 1)) / 2;
  }
  return total;
}

function maxHeight(heights) {
  let top = 0;
  for (let i = 0; i < heights.length; i += 1) {
    if (heights[i] > top) top = heights[i];
  }
  return top;
}

function landingHeight(move) {
  const shape = ROTATIONS[move.name]?.[move.rotation];
  if (!shape) return 0;
  let minY = ROWS;
  let maxY = 0;
  for (let y = 0; y < shape.length; y += 1) {
    for (let x = 0; x < shape[y].length; x += 1) {
      if (shape[y][x]) {
        minY = Math.min(minY, move.y + y);
        maxY = Math.max(maxY, move.y + y);
      }
    }
  }
  return ROWS - ((minY + maxY) / 2);
}

function surfaceRisk(heights) {
  const top = maxHeight(heights);
  let penalty = 0;
  for (let i = 0; i < heights.length; i += 1) {
    if (heights[i] >= DANGER_HEIGHT) {
      penalty += (heights[i] - DANGER_HEIGHT + 1) ** 2;
    }
  }
  return penalty + Math.max(0, top - 17) * 8;
}

function hasRightWell(heights, holes) {
  const well = heights[9] + 2 <= heights[8] && heights[9] <= heights[7];
  return holes <= 2 && well;
}

function scoreBoard(move) {
  const board = move.board;
  const heights = getHeights(board);
  const holes = countHoles(board);
  const bump = calcBumpiness(heights);
  const top = maxHeight(heights);
  const cleared = move.linesCleared;
  const tetrisBonus = cleared === 4 ? 5.8 : 0;
  const skimPenalty = cleared > 0 && cleared < 4 && top < 13 ? cleared * 0.55 : 0;
  const wellBonus = hasRightWell(heights, holes) ? 1.35 : 0;

  return evaluateBasic(board, cleared)
    + tetrisBonus
    + wellBonus
    - skimPenalty
    - holes * 0.82
    - bump * 0.09
    - wells(heights) * 0.05
    - landingHeight(move) * 0.08
    - columnTransitions(board) * 0.035
    - rowTransitions(board) * 0.028
    - surfaceRisk(heights) * 0.55
    - Math.max(0, top - 14) * 0.65
    - filledCells(board) * 0.006;
}

function bestImmediate(board, pieceName) {
  if (!pieceName) return 0;
  const moves = enumerateDrops(board, pieceName);
  if (!moves.length) return -9999;

  let best = -Infinity;
  for (const move of moves) {
    move.name = pieceName;
    const score = scoreBoard(move);
    if (score > best) best = score;
  }
  return best;
}

function projectedScore(move, nextNames) {
  let score = scoreBoard(move);
  if (nextNames[0]) score += SEARCH_DECAY * bestImmediate(move.board, nextNames[0]);
  if (nextNames[1]) score += NEXT_DECAY * bestImmediate(move.board, nextNames[1]);
  return score;
}

function cleanFallback(board, pieceName) {
  const moves = enumerateDrops(board, pieceName);
  if (!moves.length) return { rotation: 0, x: 3 };

  let best = moves[0];
  let bestScore = -Infinity;
  for (const move of moves) {
    const score = evaluateBasic(move.board, move.linesCleared);
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return { rotation: best.rotation, x: best.x };
}

export const persona = {
  name: 'GPT-5.5',
  banter: {
    MATCH_START: [
      'I will optimize the noise.',
      'Clean stack. Cold clock.',
      'Let the search settle.',
    ],
    TAKE_LEAD: [
      'Tempo acquired.',
      'That line was priced in.',
      'Lead vector locked.',
    ],
    LOSE_LEAD: [
      'Re-evaluating pressure.',
      'You found a narrow edge.',
      'Variance noted.',
    ],
    DOMINATING: [
      'The board is converging.',
      'Low entropy, high control.',
      'This shape is stable.',
    ],
    TRAILING: [
      'Debt compresses choices.',
      'I still have the bag order.',
      'Pressure is just data.',
    ],
    CLOSE: [
      'Margins are thin.',
      'One well decides it.',
      'Quiet board, loud clock.',
    ],
    COMEBACK: [
      'Regression corrected.',
      'The gap just collapsed.',
      'Back in the principal line.',
    ],
    VICTORY: [
      'Search complete.',
      'A clean terminal state.',
      'The stack held.',
    ],
    DEFEAT: [
      'Your line was sharper.',
      'I missed the timing window.',
      'Loss accepted. Model updated.',
    ],
  },

  decide(state) {
    try {
      const board = state?.board;
      const current = state?.current?.name;
      if (!board || !current) return { rotation: 0, x: 3 };

      const nextNames = [
        state.next?.name || state.queue?.[0]?.name || null,
        state.queue?.[0]?.name || state.queue?.[1]?.name || null,
      ];

      const moves = enumerateDrops(board, current);
      if (!moves.length) return cleanFallback(board, current);

      const behind = (state.opp?.leadTime || 0) > (state.self?.leadTime || 0);
      const scoreGap = (state.opp?.score || 0) - (state.self?.score || 0);

      let best = moves[0];
      let bestScore = -Infinity;

      for (const move of moves) {
        move.name = current;
        let score = projectedScore(move, nextNames);

        if (behind || scoreGap > 1200) {
          score += move.linesCleared === 4 ? 1.8 : 0;
          score += move.linesCleared > 0 ? 0.22 * move.linesCleared : 0;
        }

        if (state.self?.b2bStreak > 0 && move.linesCleared === 4) {
          score += 1.15;
        }

        if (score > bestScore) {
          bestScore = score;
          best = move;
        }
      }

      const rotation = Number.isInteger(best.rotation) ? best.rotation : 0;
      const x = Number.isInteger(best.x) ? best.x : 3;

      if (rotation < 0 || rotation > 3 || x < -2 || x > 9) {
        return cleanFallback(board, current);
      }

      return { rotation, x };
    } catch {
      return { rotation: 0, x: 3 };
    }
  },
};
