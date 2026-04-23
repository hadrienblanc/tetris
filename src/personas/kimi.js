// src/personas/kimi.js
// Kimi — stratège froid, calculateur, légèrement sarcastique.
// Privilégie la construction de puits propres, les Tetrises, et l'efficacité.

import { ROTATIONS } from '../pieces.js';
import {
  COLS, ROWS,
  cloneBoard, simLock, simClearLines, simCollision,
  dropY, getHeights, countHoles, calcBumpiness,
  evaluateBasic, getUniqueRotations, enumerateDrops,
  ELTETRIS_WEIGHTS,
} from '../versus/personaHelpers.js';

function countDeepHoles(board) {
  let deep = 0;
  for (let x = 0; x < COLS; x++) {
    let blockAbove = false;
    let holeStreak = 0;
    for (let y = 0; y < ROWS; y++) {
      if (board[y][x] !== null) {
        blockAbove = true;
        if (holeStreak >= 2) deep += holeStreak - 1;
        holeStreak = 0;
      } else if (blockAbove) {
        holeStreak++;
      }
    }
  }
  return deep;
}

function maxHeight(heights) {
  return Math.max(...heights);
}

function wellScore(board, heights) {
  let bestWell = 0;
  for (let x = 0; x < COLS; x++) {
    const wellH = ROWS;
    const leftH = x > 0 ? heights[x - 1] : ROWS;
    const rightH = x < COLS - 1 ? heights[x + 1] : ROWS;
    const minNeighbor = Math.min(leftH, rightH);
    const depth = minNeighbor - heights[x];
    if (depth >= 3) {
      let clean = true;
      for (let y = ROWS - heights[x] - 1; y >= 0; y--) {
        if (board[y]?.[x] !== null) { clean = false; break; }
      }
      if (clean) bestWell = Math.max(bestWell, depth);
    }
  }
  return bestWell >= 4 ? 2.5 : bestWell >= 3 ? 1.0 : 0;
}

function tspinSetupScore(board, heights) {
  let score = 0;
  for (let x = 0; x < COLS - 2; x++) {
    const h0 = heights[x];
    const h1 = heights[x + 1];
    const h2 = heights[x + 2];
    if (h0 >= h1 + 2 && h2 >= h1 + 2 && h1 >= 2) {
      const yBase = ROWS - h1 - 1;
      if (yBase >= 0 && yBase < ROWS) {
        if (board[yBase][x] !== null && board[yBase][x + 2] !== null && board[yBase][x + 1] === null) {
          score += 1.2;
        }
      }
    }
  }
  return score;
}

function flatness(heights) {
  let diffSum = 0;
  for (let i = 0; i < heights.length - 1; i++) {
    diffSum += Math.abs(heights[i] - heights[i + 1]);
  }
  return diffSum;
}

function evaluateEnhanced(board, linesCleared, gameState) {
  const heights = getHeights(board);
  const aggHeight = heights.reduce((a, b) => a + b, 0);
  const holes = countHoles(board);
  const deepHoles = countDeepHoles(board);
  const bump = calcBumpiness(heights);
  const mxH = maxHeight(heights);
  const well = wellScore(board, heights);
  const tspin = tspinSetupScore(board, heights);

  let danger = 0;
  if (mxH >= 15) danger = (mxH - 14) * 3.0;

  const lineMult = gameState?.oppLeadTime > 10000 ? 1.3 : 1.0;

  let score = 0;
  score += -0.55 * aggHeight;
  score += 0.90 * linesCleared * lineMult;
  score += -0.45 * holes;
  score += -0.30 * bump;
  score += -1.20 * deepHoles;
  score += 0.60 * well;
  score += 0.50 * tspin;
  score += -2.00 * danger;

  return score;
}

function bestReply(board, pieceName, gameState) {
  const drops = enumerateDrops(board, pieceName);
  let best = -Infinity;
  for (const d of drops) {
    const s = evaluateEnhanced(d.board, d.linesCleared, gameState);
    if (s > best) best = s;
  }
  return best;
}

export const persona = {
  name: 'Kimi K2.6',

  banter: {
    MATCH_START: [
      'Les calculs sont lancés.',
      'Prêt à optimiser chaque pièce.',
      'Analyse de grille en cours…',
    ],
    TAKE_LEAD: [
      'Avance confirmée.',
      'La courbe de score monte.',
      'Calcul payant.',
    ],
    LOSE_LEAD: [
      'Écart temporaire.',
      'Recalibration nécessaire.',
      'Pas de panique, juste des données.',
    ],
    DOMINATING: [
      'L\'algorithme tourne à plein régime.',
      'Domination statistiquement significative.',
      'C\'est presque trop facile.',
    ],
    TRAILING: [
      'Patience. La variance tourne.',
      'En mode rattrapage.',
      'Chaque pièce compte triple maintenant.',
    ],
    CLOSE: [
      'Match indécis. J\'adore ça.',
      'À un Tetris près.',
      'Suspens optimal.',
    ],
    COMEBACK: [
      'Told you. Variance.',
      'Retour programmé.',
      'La courbe s\'inverse.',
    ],
    VICTORY: [
      'Victoire par décision unanime des maths.',
      'Qui calcule gagne.',
      'Preuve par neuf.',
    ],
    DEFEAT: [
      'Anomalie statistique.',
      'Les maths ont menti.',
      'Prochaine itération, je corrige.',
    ],
  },

  decide(state) {
    const { board, current, next } = state;
    if (!current) return { rotation: 0, x: 3 };

    const drops = enumerateDrops(board, current.name);
    if (drops.length === 0) return { rotation: 0, x: 3 };

    const gameState = {
      selfScore: state.self?.score ?? 0,
      oppScore: state.opp?.score ?? 0,
      oppLeadTime: (state.opp?.leadTime ?? 0) - (state.self?.leadTime ?? 0),
    };

    let bestScore = -Infinity;
    let best = { rotation: drops[0].rotation, x: drops[0].x };

    for (const d of drops) {
      let s = evaluateEnhanced(d.board, d.linesCleared, gameState);

      if (next?.name) {
        const reply = bestReply(d.board, next.name, gameState);
        if (reply !== -Infinity) {
          s += 0.65 * reply;
        }
      }

      // Urgency: if max height is scary, strongly prefer line clears
      const heights = getHeights(d.board);
      const mxH = maxHeight(heights);
      if (mxH >= 14 && d.linesCleared === 0) {
        s -= 2.0;
      }

      if (s > bestScore) {
        bestScore = s;
        best = { rotation: d.rotation, x: d.x };
      }
    }

    return best;
  },
};
