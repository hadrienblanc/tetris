import { ROTATIONS, WALL_KICKS } from './pieces.js';

const COLS = 10;
const ROWS = 20;
const PIECE_NAMES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
const LOCK_DELAY = 500;      // ms de grâce
const LOCK_RESETS_MAX = 15;  // max resets du lock delay
const CLEAR_ANIM_MS = 200;   // durée du flash de ligne

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

function isOnGround(board, piece) {
  const shape = getShape(piece);
  return collides(board, shape, piece.x, piece.y + 1);
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
      y++;
    }
  }
  return cleared;
}

function checkTSpin(board, piece) {
  if (piece.name !== 'T') return false;
  const cx = piece.x + 1;
  const cy = piece.y + 1;
  const corners = [
    [cy - 1, cx - 1],
    [cy - 1, cx + 1],
    [cy + 1, cx - 1],
    [cy + 1, cx + 1],
  ];
  let filled = 0;
  for (const [r, c] of corners) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) filled++;
    else if (board[r][c] !== null) filled++;
  }
  return filled >= 3;
}

const SCORE_TABLE = [0, 100, 300, 500, 800];
const TSPIN_SCORE_TABLE = [400, 800, 1200, 1600];

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
    this.highScore = this._loadHighScore();
    this.reset();
  }

  _loadHighScore() {
    try {
      return parseInt(localStorage.getItem('tetris-highscore')) || 0;
    } catch {
      return 0;
    }
  }

  _saveHighScore() {
    try {
      localStorage.setItem('tetris-highscore', this.highScore);
    } catch {
      // localStorage indisponible (ex: iframe sandbox)
    }
  }

  reset() {
    this.board = createBoard();
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.bag = [];
    this._pieceId = 0;
    this.paused = false;
    this.current = this._nextPiece();
    this.next = this._nextPiece();
    this.hold = null;
    this.canHold = true;
    this.gameOver = false;
    this.lastDrop = 0;
    this._lockTimer = 0;
    this._lockResets = 0;
    this._isLocking = false;
    this._pauseStart = 0;
    this.clearingRows = [];
    this._clearTimer = 0;
    this._lastTimestamp = 0;
    this.combo = -1;
    this.backToBack = false;
    this._lastActionWasRotation = false;
    this.lastTSpin = false;
    this.stats = { pieces: 0, tSpins: 0, maxCombo: 0 };
  }

  _nextPiece() {
    if (this.bag.length === 0) {
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
    this.canHold = true;
    this._lockTimer = 0;
    this._lockResets = 0;
    this._isLocking = false;
    this._lastActionWasRotation = false;
    this.lastTSpin = false;
    const shape = getShape(this.current);
    if (collides(this.board, shape, this.current.x, this.current.y)) {
      this.gameOver = true;
    }
  }

  holdPiece() {
    if (!this.canHold || this.gameOver || this.paused) return false;
    this.canHold = false;
    this._lockTimer = 0;
    this._lockResets = 0;
    this._isLocking = false;
    this._lastActionWasRotation = false;

    if (this.hold) {
      const prevHold = this.hold;
      this.hold = this.current.name;
      this.current = spawnPosition(prevHold);
      this.current.id = ++this._pieceId;
      // Vérifier collision au spawn
      const shape = getShape(this.current);
      if (collides(this.board, shape, this.current.x, this.current.y)) {
        this.gameOver = true;
      }
    } else {
      this.hold = this.current.name;
      // spawn() remet canHold = true, on le force à false après
      this.spawn();
      this.canHold = false;
    }
    return true;
  }

  _actionGuard() {
    return !this.paused && !this.gameOver && this.clearingRows.length === 0;
  }

  moveLeft() {
    if (!this.current || !this._actionGuard()) return false;
    const shape = getShape(this.current);
    if (!collides(this.board, shape, this.current.x - 1, this.current.y)) {
      this.current.x--;
      this._lastActionWasRotation = false;
      this._resetLockDelay();
      return true;
    }
    return false;
  }

  moveRight() {
    if (!this.current || !this._actionGuard()) return false;
    const shape = getShape(this.current);
    if (!collides(this.board, shape, this.current.x + 1, this.current.y)) {
      this.current.x++;
      this._lastActionWasRotation = false;
      this._resetLockDelay();
      return true;
    }
    return false;
  }

  moveDown() {
    if (!this.current || !this._actionGuard()) return false;
    const shape = getShape(this.current);
    if (!collides(this.board, shape, this.current.x, this.current.y + 1)) {
      this.current.y++;
      this._isLocking = false;
      this._lockTimer = 0;
      this._lastActionWasRotation = false;
      return true;
    }
    return false;
  }

  hardDrop() {
    if (!this._actionGuard()) return;
    // Préserver le flag rotation — hardDrop ne compte pas comme mouvement latéral
    const wasRotation = this._lastActionWasRotation;
    let dropped = 0;
    while (this.moveDown()) dropped++;
    this._lastActionWasRotation = wasRotation;
    this.score += dropped * 2;
    this._lock();
    this.lastDrop = performance.now();
  }

  rotate() {
    if (!this.current || !this._actionGuard()) return false;
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
        this._lastActionWasRotation = true;
        this._resetLockDelay();
        return true;
      }
    }
    return false;
  }

  _resetLockDelay() {
    if (this._isLocking && this._lockResets < LOCK_RESETS_MAX) {
      this._lockTimer = performance.now();
      this._lockResets++;
    }
  }

  _lock() {
    const isTSpin = this._lastActionWasRotation && checkTSpin(this.board, this.current);
    this.lastTSpin = isTSpin;
    lock(this.board, this.current);
    this._lastActionWasRotation = false;
    this.stats.pieces++;

    const fullRows = [];
    for (let y = ROWS - 1; y >= 0; y--) {
      if (this.board[y].every(cell => cell !== null)) {
        fullRows.push(y);
      }
    }

    if (fullRows.length > 0) {
      this.clearingRows = fullRows;
      this._clearTimer = 0;
      // lastTSpin sera consommé dans _finishClear()
    } else {
      // T-spin sans clear : bonus 400 × level
      if (isTSpin) {
        this.score += 400 * this.level;
        this.stats.tSpins++;
        if (this.onTSpin) this.onTSpin(0);
      }
      this.combo = -1;
      if (this.onLock) this.onLock();
      this._updateHighScore();
      this.spawn();
      if (this.gameOver && this.onGameOver) this.onGameOver();
    }
  }

  _updateHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this._saveHighScore();
      if (this.onNewHighScore) this.onNewHighScore(this.highScore);
    }
  }

  _finishClear() {
    const fullRows = this.clearingRows;
    const rowSnapshots = fullRows.map(y => [...this.board[y]]);
    const cleared = clearLines(this.board);
    this.clearingRows = [];
    const isTSpin = this.lastTSpin;
    this.lastTSpin = false;
    if (isTSpin) this.stats.tSpins++;
    if (cleared > 0) {
      const prevLevel = this.level;
      this.combo++;
      if (this.combo > this.stats.maxCombo) this.stats.maxCombo = this.combo;
      const isTetris = cleared === 4;
      const isDifficult = isTetris || (isTSpin && cleared >= 1);
      let multiplier = 1;
      if (this.backToBack && isDifficult) multiplier = 1.5;
      this.backToBack = isDifficult;
      let baseScore;
      if (isTSpin && cleared <= 3) {
        baseScore = TSPIN_SCORE_TABLE[cleared] * this.level;
      } else {
        baseScore = calcScore(cleared, this.level);
      }
      let earned = Math.floor(baseScore * multiplier);
      if (this.combo > 0) earned += 50 * this.combo * this.level;
      this.score += earned;
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
      if (this.onLinesCleared) this.onLinesCleared(fullRows, rowSnapshots, cleared);
      if (isTSpin && this.onTSpin) this.onTSpin(cleared);
      if (isDifficult && multiplier > 1 && this.onBackToBack) this.onBackToBack();
      if (this.combo > 0 && this.onCombo) this.onCombo(this.combo);
      if (this.level > prevLevel && this.onLevelUp) this.onLevelUp(this.level);
    }
    this._updateHighScore();
    this.spawn();
    if (this.gameOver && this.onGameOver) this.onGameOver();
  }

  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    if (!this.paused) {
      // Compenser le temps passé en pause pour lock delay et gravité
      const now = performance.now();
      const elapsed = now - this._pauseStart;
      if (this._isLocking) this._lockTimer += elapsed;
      if (this._clearTimer > 0) this._clearTimer += elapsed;
      this.lastDrop += elapsed;
    } else {
      this._pauseStart = performance.now();
    }
  }

  update(timestamp) {
    this._lastTimestamp = timestamp;
    if (this.gameOver || this.paused) return;

    // Animation de line clear
    if (this.clearingRows.length > 0) {
      if (this._clearTimer === 0) this._clearTimer = timestamp;
      if (timestamp - this._clearTimer >= CLEAR_ANIM_MS) {
        this._finishClear();
        this.lastDrop = timestamp;
      }
      return;
    }

    if (!this.current) return;

    // Lock delay : si la pièce est au sol, démarrer le timer
    if (isOnGround(this.board, this.current)) {
      if (!this._isLocking) {
        this._isLocking = true;
        this._lockTimer = timestamp;
      } else if (timestamp - this._lockTimer >= LOCK_DELAY) {
        this._lock();
        this.lastDrop = timestamp;
        return;
      }
    } else {
      this._isLocking = false;
      this._lockTimer = 0;
    }

    // Gravité
    const interval = getDropInterval(this.level);
    if (timestamp - this.lastDrop >= interval) {
      if (!this.moveDown()) {
        // Ne pas locker tout de suite — le lock delay s'en charge
        if (!this._isLocking) {
          this._isLocking = true;
          this._lockTimer = timestamp;
        }
      }
      this.lastDrop = timestamp;
    }
  }

  get clearProgress() {
    if (this.clearingRows.length === 0 || this._clearTimer === 0) return 0;
    return Math.max(0, Math.min(1, (this._lastTimestamp - this._clearTimer) / CLEAR_ANIM_MS));
  }

  getGhostY() {
    const shape = getShape(this.current);
    let gy = this.current.y;
    while (!collides(this.board, shape, this.current.x, gy + 1)) gy++;
    return gy;
  }
}
