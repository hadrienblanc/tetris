// Primitives Tetris exposées aux personas LLM.
// Tout ce qui est ici est pur, testable, réutilisable.
// Les personas importent ces fonctions pour bâtir leur heuristique.

import { ROTATIONS } from '../pieces.js';

export const COLS = 10;
export const ROWS = 20;

// Poids El-Tetris (référence historique).
// Les personas peuvent les réutiliser ou les ignorer.
export const ELTETRIS_WEIGHTS = Object.freeze({
  height:    -0.510066,
  lines:      0.760666,
  holes:     -0.35663,
  bumpiness: -0.184483,
});

export { ROTATIONS };

export function cloneBoard(board) {
  return board.map(row => [...row]);
}

export function simLock(board, shape, ox, oy, name) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;
      const by = oy + y;
      const bx = ox + x;
      if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
        board[by][bx] = name;
      }
    }
  }
}

export function simClearLines(board) {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(cell => cell !== null)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      cleared++;
      y++;
    }
  }
  return cleared;
}

export function simCollision(board, shape, ox, oy) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;
      const bx = ox + x;
      const by = oy + y;
      if (bx < 0 || bx >= COLS || by >= ROWS) return true;
      if (by < 0) continue;
      if (board[by][bx] !== null) return true;
    }
  }
  return false;
}

export function dropY(board, shape, ox) {
  let y = 0;
  while (!simCollision(board, shape, ox, y + 1)) y++;
  return y;
}

export function getHeights(board) {
  const heights = Array(COLS).fill(0);
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (board[y][x] !== null) {
        heights[x] = ROWS - y;
        break;
      }
    }
  }
  return heights;
}

export function countHoles(board) {
  let holes = 0;
  for (let x = 0; x < COLS; x++) {
    let foundBlock = false;
    for (let y = 0; y < ROWS; y++) {
      if (board[y][x] !== null) foundBlock = true;
      else if (foundBlock) holes++;
    }
  }
  return holes;
}

export function calcBumpiness(heights) {
  let bump = 0;
  for (let i = 0; i < heights.length - 1; i++) {
    bump += Math.abs(heights[i] - heights[i + 1]);
  }
  return bump;
}

export function countCompleteLines(board) {
  let count = 0;
  for (let y = 0; y < ROWS; y++) {
    if (board[y].every(cell => cell !== null)) count++;
  }
  return count;
}

// Évaluation El-Tetris standard — sert de baseline et de template.
// Convention : le board est DÉJÀ clearé quand on appelle evaluate. Le nombre de
// lignes effacées par le coup doit être passé en 2e argument, sinon le poids
// `lines` reste à zéro (bug historique si oublié — d'où la signature explicite).
export function evaluateBasic(board, linesCleared = 0, weights = ELTETRIS_WEIGHTS) {
  const heights = getHeights(board);
  const aggHeight = heights.reduce((a, b) => a + b, 0);
  const holes = countHoles(board);
  const bump = calcBumpiness(heights);
  return weights.height    * aggHeight
       + weights.lines     * linesCleared
       + weights.holes     * holes
       + weights.bumpiness * bump;
}

// Déduplique les rotations identiques (ex: O a 1 rotation unique, I/S/Z en ont 2).
export function getUniqueRotations(name) {
  const all = ROTATIONS[name];
  const seen = new Set();
  const unique = [];
  for (let r = 0; r < all.length; r++) {
    const key = all[r].map(row => row.join('')).join('|');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(r);
    }
  }
  return unique;
}

// Énumère toutes les positions de lock possibles pour une pièce sur un board donné.
// Renvoie [{ rotation, x, y, board: boardAfterLock, linesCleared }] — pratique
// pour les personas qui veulent raisonner move-par-move.
export function enumerateDrops(board, pieceName) {
  const results = [];
  for (const rot of getUniqueRotations(pieceName)) {
    const shape = ROTATIONS[pieceName][rot];
    for (let x = -2; x <= COLS; x++) {
      if (simCollision(board, shape, x, 0)) continue;
      const y = dropY(board, shape, x);
      const next = cloneBoard(board);
      simLock(next, shape, x, y, pieceName);
      const linesCleared = simClearLines(next);
      results.push({ rotation: rot, x, y, board: next, linesCleared });
    }
  }
  return results;
}
