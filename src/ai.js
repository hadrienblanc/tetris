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

export class AI {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.speed = 80; // ms entre chaque action AI
    this.lastMove = 0;
    this.moves = [];
    this._lastPieceName = '';
    this._lastPieceRot = -1;
  }

  toggle() {
    this.active = !this.active;
    this.moves = [];
    this._lastPieceName = '';
  }

  isActive() {
    return this.active;
  }

  setSpeed(ms) {
    this.speed = Math.max(20, ms);
  }

  update(timestamp) {
    if (!this.active || this.game.gameOver) return;

    // Détecter nouvelle pièce → recalculer le plan
    const cur = this.game.current;
    if (cur && (cur.name !== this._lastPieceName || cur.rotation !== this._lastPieceRot)) {
      this._lastPieceName = cur.name;
      this._lastPieceRot = cur.rotation;
      this._plan();
    }

    // Exécuter les moves en file
    if (this.moves.length > 0 && timestamp - this.lastMove >= this.speed) {
      const action = this.moves.shift();
      action();
      this.lastMove = timestamp;
    }
  }

  _plan() {
    const { board, current } = this.game;
    if (!current) return;

    let bestScore = -Infinity;
    let bestTarget = null;

    for (let rot = 0; rot < 4; rot++) {
      const shape = ROTATIONS[current.name][rot];
      for (let x = -2; x <= COLS; x++) {
        if (simCollision(board, shape, x, 0)) continue;
        const y = dropY(board, shape, x);
        if (y < 0) continue;

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

    for (let i = 0; i < rots; i++) {
      moves.push(() => this.game.rotate());
    }

    const dx = target.x - current.x;
    const moveFn = dx > 0 ? () => this.game.moveRight() : () => this.game.moveLeft();
    for (let i = 0; i < Math.abs(dx); i++) {
      moves.push(moveFn);
    }

    moves.push(() => this.game.hardDrop());
    return moves;
  }
}
