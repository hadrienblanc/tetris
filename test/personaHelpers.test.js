import { describe, it, expect } from 'vitest';
import {
  COLS,
  ROWS,
  cloneBoard,
  simLock,
  simClearLines,
  simCollision,
  dropY,
  getHeights,
  countHoles,
  calcBumpiness,
  countCompleteLines,
  evaluateBasic,
  getUniqueRotations,
  enumerateDrops,
  ELTETRIS_WEIGHTS,
} from '../src/versus/personaHelpers.js';
import { ROTATIONS } from '../src/pieces.js';

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function boardWithFloor(filledCols = []) {
  const b = emptyBoard();
  for (const x of filledCols) b[ROWS - 1][x] = 'I';
  return b;
}

describe('personaHelpers — constantes', () => {
  it('COLS=10, ROWS=20 (standard Tetris)', () => {
    expect(COLS).toBe(10);
    expect(ROWS).toBe(20);
  });
  it('ELTETRIS_WEIGHTS gelé (évite mutation accidentelle)', () => {
    expect(Object.isFrozen(ELTETRIS_WEIGHTS)).toBe(true);
  });
});

describe('cloneBoard', () => {
  it('produit une copie profonde (mutation indépendante)', () => {
    const b = emptyBoard();
    const c = cloneBoard(b);
    c[0][0] = 'X';
    expect(b[0][0]).toBe(null);
    expect(c[0][0]).toBe('X');
  });
});

describe('simCollision', () => {
  const shapeI = ROTATIONS.I[0]; // horizontale
  it('pas de collision sur board vide au spawn', () => {
    expect(simCollision(emptyBoard(), shapeI, 3, 0)).toBe(false);
  });
  it('collision sur mur gauche', () => {
    expect(simCollision(emptyBoard(), shapeI, -2, 0)).toBe(true);
  });
  it('collision sur mur droit', () => {
    expect(simCollision(emptyBoard(), shapeI, COLS - 3, 0)).toBe(true);
  });
  it('collision avec plancher', () => {
    expect(simCollision(emptyBoard(), shapeI, 3, ROWS)).toBe(true);
  });
  it('collision avec bloc existant', () => {
    const b = boardWithFloor([3, 4, 5, 6]);
    expect(simCollision(b, shapeI, 3, ROWS - 2)).toBe(true);
  });
  it('pas de collision si shape au-dessus (y<0)', () => {
    expect(simCollision(emptyBoard(), shapeI, 3, -1)).toBe(false);
  });
});

describe('dropY', () => {
  it('sur board vide, I horizontale descend à la dernière ligne', () => {
    // I occupe la ligne y+1 du shape — donc plancher 18 (ROWS-2)
    const y = dropY(emptyBoard(), ROTATIONS.I[0], 3);
    expect(y).toBe(ROWS - 2);
  });
  it('repose sur une pièce existante', () => {
    const b = boardWithFloor([3, 4, 5, 6]);
    const y = dropY(b, ROTATIONS.I[0], 3);
    expect(y).toBe(ROWS - 3); // au-dessus de la rangée pleine
  });
});

describe('simLock + simClearLines', () => {
  it('lock pose les cellules de la shape sur le board', () => {
    const b = emptyBoard();
    simLock(b, ROTATIONS.I[0], 3, 18, 'I');
    expect(b[19][3]).toBe('I');
    expect(b[19][4]).toBe('I');
    expect(b[19][5]).toBe('I');
    expect(b[19][6]).toBe('I');
  });
  it('simClearLines efface les lignes pleines et retourne le count', () => {
    const b = emptyBoard();
    for (let x = 0; x < COLS; x++) b[ROWS - 1][x] = 'Z';
    const cleared = simClearLines(b);
    expect(cleared).toBe(1);
    expect(b[ROWS - 1].every(c => c === null)).toBe(true);
  });
  it('simClearLines gère plusieurs lignes consécutives', () => {
    const b = emptyBoard();
    for (let y = ROWS - 4; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) b[y][x] = 'I';
    }
    const cleared = simClearLines(b);
    expect(cleared).toBe(4);
  });
});

describe('getHeights', () => {
  it('board vide → zéros', () => {
    expect(getHeights(emptyBoard())).toEqual(Array(COLS).fill(0));
  });
  it('hauteur = ROWS - index du premier bloc depuis le haut', () => {
    const b = emptyBoard();
    b[15][0] = 'I'; // ligne 15 → hauteur 5
    b[10][9] = 'T'; // ligne 10 → hauteur 10
    const h = getHeights(b);
    expect(h[0]).toBe(5);
    expect(h[9]).toBe(10);
    expect(h[5]).toBe(0);
  });
});

describe('countHoles', () => {
  it('zéro sur board vide', () => {
    expect(countHoles(emptyBoard())).toBe(0);
  });
  it('détecte une case vide sous un bloc', () => {
    const b = emptyBoard();
    b[10][0] = 'I';
    // les 9 cases vides en dessous de b[10][0] sont des trous
    expect(countHoles(b)).toBe(9);
  });
  it('pas de trou si cases vides au-dessus', () => {
    const b = emptyBoard();
    b[15][0] = 'I'; // rien au-dessus, rien en-dessous de bloc → pas de trou
    // sous b[15][0] : 4 cases vides = 4 trous
    expect(countHoles(b)).toBe(4);
  });
});

describe('calcBumpiness', () => {
  it('zéro si hauteurs égales', () => {
    expect(calcBumpiness(Array(COLS).fill(5))).toBe(0);
  });
  it('somme des |h[i]-h[i+1]|', () => {
    expect(calcBumpiness([0, 3, 0, 3, 0, 3, 0, 3, 0, 3])).toBe(3 * 9);
  });
});

describe('countCompleteLines', () => {
  it('zéro sur board vide', () => {
    expect(countCompleteLines(emptyBoard())).toBe(0);
  });
  it('compte les lignes totalement remplies', () => {
    const b = emptyBoard();
    for (let x = 0; x < COLS; x++) {
      b[ROWS - 1][x] = 'I';
      b[ROWS - 2][x] = 'I';
    }
    expect(countCompleteLines(b)).toBe(2);
  });
});

describe('evaluateBasic', () => {
  it('board vide → score 0', () => {
    expect(evaluateBasic(emptyBoard())).toBe(0);
  });
  it('board avec blocs sans lignes cleared → score négatif (penalité hauteur/trous/bump)', () => {
    const b = emptyBoard();
    b[15][0] = 'I';
    expect(evaluateBasic(b, 0)).toBeLessThan(0);
  });
  it('bonus de lignes effacées (linesCleared argument)', () => {
    const b = emptyBoard();
    const zeroLines = evaluateBasic(b, 0);
    const fourLines = evaluateBasic(b, 4);
    expect(fourLines).toBeGreaterThan(zeroLines);
  });
  it('accepte des poids custom (3e argument)', () => {
    const b = emptyBoard();
    b[15][0] = 'I';
    const neutral = { height: 0, lines: 0, holes: 0, bumpiness: 0 };
    expect(evaluateBasic(b, 2, neutral)).toBe(0);
  });
});

describe('getUniqueRotations', () => {
  it('O n\'a qu\'une rotation unique (symétrie carrée, matrices 2×2 identiques)', () => {
    expect(getUniqueRotations('O')).toHaveLength(1);
  });
  it('les autres pièces ont 4 rotations distinctes au sens matriciel', () => {
    // Note : la dédup est stricte (string-hash des matrices). I/S/Z sont
    // visuellement symétriques mais occupent des cellules différentes selon
    // la rotation — donc 4 placements distincts. Pas une optimisation ici.
    for (const name of ['I', 'T', 'S', 'Z', 'J', 'L']) {
      expect(getUniqueRotations(name)).toHaveLength(4);
    }
  });
});

describe('enumerateDrops', () => {
  it('énumère tous les placements possibles d\'une pièce', () => {
    const drops = enumerateDrops(emptyBoard(), 'O');
    // O : 1 rotation × ~9 positions x (x ∈ [-2..COLS] filtré par collision)
    expect(drops.length).toBeGreaterThan(0);
    for (const d of drops) {
      expect(d.rotation).toBe(0);
      expect(typeof d.x).toBe('number');
      expect(typeof d.y).toBe('number');
      expect(d.board).toBeDefined();
      expect(typeof d.linesCleared).toBe('number');
    }
  });
  it('I horizontale sur board vide → 7 positions (x=0..6)', () => {
    const drops = enumerateDrops(emptyBoard(), 'I').filter(d => d.rotation === 0);
    expect(drops.length).toBe(7);
  });
  it('détecte les lignes effacées par un drop', () => {
    // remplir 9 colonnes sur la dernière ligne, laisser la colonne 3 vide
    // puis dropper I verticale dans la colonne 3 ne remplit pas — utilisons plutôt
    // un setup où un O comble le trou
    const b = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    for (let x = 0; x < COLS; x++) {
      if (x !== 3 && x !== 4) b[ROWS - 1][x] = 'Z';
    }
    const drops = enumerateDrops(b, 'O');
    // au moins un drop (le bon) doit clear 1 ligne
    const anyClear = drops.some(d => d.linesCleared >= 1);
    expect(anyClear).toBe(true);
  });
});
