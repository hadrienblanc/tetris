import { ROTATIONS, WALL_KICKS } from './pieces.js';

const COLS = 10;
const ROWS = 20;
const PIECE_NAMES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function spawnPosition(name) {
  const shape = ROTATIONS[name][0];
  const x = Math.floor((COLS - shape[0].length) / 2);
  return { name, rotation: 0, x, y: 0 };
}

function getShape(piece) {
  return ROTATIONS[piece.name][piece.rotation];
}

function collides(board, shape, offsetX, offsetY) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;
      const bx = offsetX + x;
      const by = offsetY + y;
      if (bx < 0 || bx >= COLS || by >= ROWS) return true;
      if (by < 0) continue;
      if (board[by][bx] !== null) return true;
    }
  }
  return false;
}

function lock(board, piece) {
  const shape = getShape(piece);
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;
      const by = piece.y + y;
      const bx = piece.x + x;
      if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
        board[by][bx] = piece.name;
      }
    }
  }
}

function clearLines(board) {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(cell => cell !== null)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      cleared++;
      y++; // recheck same index
    }
  }
  return cleared;
}

const SCORE_TABLE = [0, 100, 300, 500, 800];

function calcScore(linesCleared, level) {
  return SCORE_TABLE[linesCleared] * level;
}

function getDropInterval(level) {
  return Math.max(50, 800 - (level - 1) * 70);
}

export class Game {
  constructor() {
    this.cols = COLS;
    this.rows = ROWS;
    this.reset();
  }

  reset() {
    this.board = createBoard();
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.bag = [];
    this._pieceId = 0;
    this.current = this._nextPiece();
    this.next = this._nextPiece();
    this.gameOver = false;
    this.lastDrop = 0;
  }

  _nextPiece() {
    if (this.bag.length === 0) {
      // 7-bag randomizer
      this.bag = [...PIECE_NAMES];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    const piece = spawnPosition(this.bag.pop());
    piece.id = ++this._pieceId;
    return piece;
  }

  spawn() {
    this.current = this.next;
    this.next = this._nextPiece();
    const shape = getShape(this.current);
    if (collides(this.board, shape, this.current.x, this.current.y)) {
      this.gameOver = true;
    }
  }

  moveLeft() {
    const shape = getShape(this.current);
    if (!collides(this.board, shape, this.current.x - 1, this.current.y)) {
      this.current.x--;
      return true;
    }
    return false;
  }

  moveRight() {
    const shape = getShape(this.current);
    if (!collides(this.board, shape, this.current.x + 1, this.current.y)) {
      this.current.x++;
      return true;
    }
    return false;
  }

  moveDown() {
    const shape = getShape(this.current);
    if (!collides(this.board, shape, this.current.x, this.current.y + 1)) {
      this.current.y++;
      return true;
    }
    return false;
  }

  hardDrop() {
    let dropped = 0;
    while (this.moveDown()) dropped++;
    this.score += dropped * 2;
    this._lock();
    this.lastDrop = performance.now();
  }

  rotate() {
    const oldRot = this.current.rotation;
    const newRot = (oldRot + 1) % 4;
    const newShape = ROTATIONS[this.current.name][newRot];
    const kicks = this.current.name === 'I' ? WALL_KICKS.I : WALL_KICKS.normal;
    const kickData = kicks[oldRot];

    for (const [dx, dy] of kickData) {
      if (!collides(this.board, newShape, this.current.x + dx, this.current.y + dy)) {
        this.current.rotation = newRot;
        this.current.x += dx;
        this.current.y += dy;
        return true;
      }
    }
    return false;
  }

  _lock() {
    lock(this.board, this.current);
    const cleared = clearLines(this.board);
    if (cleared > 0) {
      this.score += calcScore(cleared, this.level);
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
    }
    this.spawn();
  }

  update(timestamp) {
    if (this.gameOver) return;

    const interval = getDropInterval(this.level);
    if (timestamp - this.lastDrop >= interval) {
      if (!this.moveDown()) {
        this._lock();
      }
      this.lastDrop = timestamp;
    }
  }

  getGhostY() {
    const shape = getShape(this.current);
    let gy = this.current.y;
    while (!collides(this.board, shape, this.current.x, gy + 1)) {
      gy++;
    }
    return gy;
  }
}
