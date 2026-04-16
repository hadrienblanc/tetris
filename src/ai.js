import { ROTATIONS } from './pieces.js';

const COLS = 10;
const ROWS = 20;

// Poids heuristiques (El-Tetris)
const W_HEIGHT    = -0.510066;
const W_LINES     =  0.760666;
const W_HOLES     = -0.35663;
const W_BUMPINESS = -0.184483;

function cloneBoard(board) {
  return board.map(row => [...row]);
}

function simLock(board, shape, ox, oy, name) {
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

function simClearLines(board) {
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

function simCollision(board, shape, ox, oy) {
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

function dropY(board, shape, ox) {
  let y = 0;
  while (!simCollision(board, shape, ox, y + 1)) y++;
  return y;
}

function getHeights(board) {
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

function countHoles(board) {
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

function calcBumpiness(heights) {
  let bump = 0;
  for (let i = 0; i < heights.length - 1; i++) {
    bump += Math.abs(heights[i] - heights[i + 1]);
  }
  return bump;
}

function countCompleteLines(board) {
  let count = 0;
  for (let y = 0; y < ROWS; y++) {
    if (board[y].every(cell => cell !== null)) count++;
  }
  return count;
}

function evaluate(board) {
  const heights = getHeights(board);
  const aggHeight = heights.reduce((a, b) => a + b, 0);
  const lines = countCompleteLines(board);
  const holes = countHoles(board);
  const bump = calcBumpiness(heights);

  return W_HEIGHT * aggHeight + W_LINES * lines + W_HOLES * holes + W_BUMPINESS * bump;
}

// Déduplication des rotations identiques (ex: O-piece)
function getUniqueRotations(name) {
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

export class AI {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.speed = 80;
    this.lastMove = 0;
    this.moves = [];
    this._lastPieceId = -1;
  }

  toggle() {
    this.active = !this.active;
    this.moves = [];
    this._lastPieceId = -1;
  }

  isActive() {
    return this.active;
  }

  setSpeed(ms) {
    this.speed = Math.max(20, ms);
  }

  update(timestamp) {
    if (!this.active || this.game.gameOver) return;

    // Détecter nouvelle pièce par ID
    const cur = this.game.current;
    if (!cur) return;
    if (cur.id !== this._lastPieceId) {
      this._lastPieceId = cur.id;
      this._plan();
      if (this.moves.length === 0) return;
    }

    // Exécuter les moves en file
    if (this.moves.length > 0 && timestamp - this.lastMove >= this.speed) {
      const action = this.moves.shift();
      const success = action();

      // Si un mouvement échoue, replanifier depuis l'état actuel
      if (success === false) {
        this.moves = [];
        this._plan();
      }

      this.lastMove = timestamp;
    }
  }

  _plan() {
    const { board, current } = this.game;
    if (!current) return;

    let bestScore = -Infinity;
    let bestTarget = null;

    const uniqueRots = getUniqueRotations(current.name);

    for (const rot of uniqueRots) {
      const shape = ROTATIONS[current.name][rot];
      for (let x = -2; x <= COLS; x++) {
        if (simCollision(board, shape, x, 0)) continue;
        const y = dropY(board, shape, x);

        const testBoard = cloneBoard(board);
        simLock(testBoard, shape, x, y, current.name);
        simClearLines(testBoard);

        const score = evaluate(testBoard);
        if (score > bestScore) {
          bestScore = score;
          bestTarget = { rotation: rot, x };
        }
      }
    }

    if (!bestTarget) return;
    this.moves = this._buildMoves(current, bestTarget);
  }

  _buildMoves(current, target) {
    const moves = [];
    const rots = ((target.rotation - current.rotation) % 4 + 4) % 4;

    // Rotations — chaque move retourne le résultat de rotate()
    for (let i = 0; i < rots; i++) {
      moves.push(() => this.game.rotate());
    }

    // Mouvements horizontaux — recalculés après rotations (wall kicks)
    // On ajoute un seul move qui recalcule le dx à l'exécution
    moves.push(() => {
      const dx = target.x - this.game.current.x;
      if (dx > 0) {
        for (let i = 0; i < dx; i++) this.game.moveRight();
      } else if (dx < 0) {
        for (let i = 0; i < -dx; i++) this.game.moveLeft();
      }
      return true;
    });

    // Hard drop
    moves.push(() => { this.game.hardDrop(); return true; });

    return moves;
  }
}
