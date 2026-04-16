// 7 tétriminos — définitions + rotations SRS
// Chaque pièce est définie par ses 4 rotations (matrices 4×4 ou 3×3)

const PIECES = {
  I: {
    shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    color: '#00f0f0', // cyan
  },
  O: {
    shape: [[1,1],[1,1]],
    color: '#f0f000', // jaune
  },
  T: {
    shape: [[0,1,0],[1,1,1],[0,0,0]],
    color: '#a000f0', // violet
  },
  S: {
    shape: [[0,1,1],[1,1,0],[0,0,0]],
    color: '#00f000', // vert
  },
  Z: {
    shape: [[1,1,0],[0,1,1],[0,0,0]],
    color: '#f00000', // rouge
  },
  J: {
    shape: [[1,0,0],[1,1,1],[0,0,0]],
    color: '#0000f0', // bleu
  },
  L: {
    shape: [[0,0,1],[1,1,1],[0,0,0]],
    color: '#f0a000', // orange
  },
};

// Rotation 90° horaire d'une matrice
function rotateMatrix(matrix) {
  const n = matrix.length;
  const result = [];
  for (let y = 0; y < n; y++) {
    result[y] = [];
    for (let x = 0; x < n; x++) {
      result[y][x] = matrix[n - 1 - x][y];
    }
  }
  return result;
}

// Pré-calcule les 4 rotations de chaque pièce
const ROTATIONS = {};
for (const [name, piece] of Object.entries(PIECES)) {
  ROTATIONS[name] = [piece.shape];
  let current = piece.shape;
  for (let r = 1; r < 4; r++) {
    current = rotateMatrix(current);
    ROTATIONS[name][r] = current;
  }
}

// Wall kick data SRS — offsets pour les rotations I et les autres pièces
const WALL_KICKS = {
  normal: [
    [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]], // 0→1
    [[0,0],[1,0],[1,-1],[0,2],[1,2]],       // 1→2
    [[0,0],[1,0],[1,1],[0,-2],[1,-2]],       // 2→3
    [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],     // 3→0
  ],
  I: [
    [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],   // 0→1
    [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],    // 1→2
    [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],    // 2→3
    [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],    // 3→0
  ],
};

export { PIECES, ROTATIONS, WALL_KICKS };
