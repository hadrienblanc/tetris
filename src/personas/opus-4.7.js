// Persona Opus 4.7 — écrite directement par l'agent Claude Opus 4.7 (context 1M).
// 2-ply lookahead, évaluation enrichie (pénalité de trous profonds, bonus well,
// mild maxHeight cap) et petit ajustement en fonction de l'adversaire.

import {
  COLS, ROWS,
  enumerateDrops,
  getHeights,
  countHoles,
  calcBumpiness,
} from '../versus/personaHelpers.js';

const DISCOUNT = 0.7;

// Poids affinés — légèrement plus agressifs sur les lines qu'El-Tetris pur,
// pénalise la profondeur des trous (un trou à la rangée 18 vaut bien pire
// qu'à la rangée 8), et récompense un puits propre pour les Tetris.
const W = {
  height:    -0.52,
  lines:      0.96,
  holes:     -0.44,
  bumpiness: -0.18,
  holeDepth: -0.04,
  wellBonus:  0.15,
  maxHeight: -0.05,
};

export const persona = {
  name: 'Opus 4.7',

  banter: {
    MATCH_START: [
      'Contexte chargé. Allons-y.',
      'J\'ai lu les règles. On y va.',
      '1 million de tokens, une stratégie.',
    ],
    TAKE_LEAD: [
      'Premier pivot validé.',
      'Score devant. Pour l\'instant.',
      'Avance acquise — je reste prudent.',
    ],
    LOSE_LEAD: [
      'Hypothèse révisée.',
      'Tu mènes. Je prends note.',
      'Correction du cap.',
    ],
    DOMINATING: [
      'Je reste factuel : je mène.',
      'Écart maintenu. Ni fierté, ni complaisance.',
      'La courbe parle d\'elle-même.',
    ],
    TRAILING: [
      'Je reconnais l\'écart.',
      'Recherche d\'ouvertures en cours.',
      'Je dois mieux faire.',
    ],
    CLOSE: [
      'Marge d\'erreur négligeable.',
      'On joue frame par frame.',
      'Match serré — tant mieux.',
    ],
    COMEBACK: [
      'Retour documenté.',
      'La partie n\'était pas jouée.',
      'Toujours lire jusqu\'au bout.',
    ],
    VICTORY: [
      'Partie gagnée. Merci pour le match.',
      'GG. Analyse complète.',
      'Conclusion : victoire sobre.',
    ],
    DEFEAT: [
      'Partie perdue, lucidement.',
      'Bien joué. J\'ai appris.',
      'Défaite assumée.',
    ],
  },

  decide(state) {
    const { board, current, next, self, opp } = state;
    if (!current) return { rotation: 0, x: 3 };

    const drops1 = enumerateDrops(board, current.name);
    if (drops1.length === 0) return { rotation: 0, x: 3 };

    // Ajustement adversaire : si je traîne depuis > 15s je deviens plus
    // offensif sur les clears ; si je mène depuis > 15s je durcis anti-trous.
    const leadGap = (self?.leadTime || 0) - (opp?.leadTime || 0);
    const aggressive = leadGap < -15_000;
    const protect = leadGap > 15_000;
    const linesMul = aggressive ? 1.1 : (protect ? 0.95 : 1.0);
    const holesMul = protect ? 1.15 : 1.0;

    function scoreBoard(board, linesCleared) {
      const heights = getHeights(board);
      const aggH = heights.reduce((a, b) => a + b, 0);
      const maxH = Math.max(...heights);
      const holes = countHoles(board);
      const bump = calcBumpiness(heights);
      let holeDepth = 0;
      for (let x = 0; x < COLS; x++) {
        let found = false;
        for (let y = 0; y < ROWS; y++) {
          if (board[y][x] !== null) found = true;
          else if (found) holeDepth += (ROWS - y);
        }
      }
      let wellBonus = 0;
      for (let x = 0; x < COLS; x++) {
        const left  = x === 0 ? ROWS : heights[x - 1];
        const right = x === COLS - 1 ? ROWS : heights[x + 1];
        const minNeighbor = Math.min(left, right);
        if (minNeighbor - heights[x] >= 2) wellBonus += 1;
      }
      return W.height    * aggH
           + W.lines     * linesMul * linesCleared
           + W.holes     * holesMul * holes
           + W.bumpiness * bump
           + W.holeDepth * holeDepth
           + W.wellBonus * wellBonus
           + W.maxHeight * maxH;
    }

    let bestScore = -Infinity;
    let bestDrop = drops1[0];

    for (const d1 of drops1) {
      const s1 = scoreBoard(d1.board, d1.linesCleared);

      let bestSecond = 0;
      if (next && next.name) {
        const drops2 = enumerateDrops(d1.board, next.name);
        if (drops2.length > 0) {
          bestSecond = -Infinity;
          for (const d2 of drops2) {
            const s2 = scoreBoard(d2.board, d2.linesCleared);
            if (s2 > bestSecond) bestSecond = s2;
          }
        }
      }

      const total = s1 + DISCOUNT * (bestSecond === -Infinity ? 0 : bestSecond);
      if (total > bestScore) { bestScore = total; bestDrop = d1; }
    }

    return { rotation: bestDrop.rotation, x: bestDrop.x };
  },
};
