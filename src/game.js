import { ROTATIONS, WALL_KICKS } from './pieces.js';

const COLS = 10;
const ROWS = 20;
const PIECE_NAMES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
const LOCK_DELAY = 500;      // ms de grâce
const LOCK_RESETS_MAX = 15;  // max resets du lock delay
const CLEAR_ANIM_MS = 200;   // durée du flash de ligne
const TRAIL_MS = 150;        // durée du hard drop trail
const SHAKE_MS = 250;        // durée du screen shake
const SHAKE_PX = 5;          // amplitude max en pixels
const FLASH_MS = 300;        // durée du flash level up
const LOCK_FLASH_MS = 120;   // durée du lock flash

const DIFFICULTY = {
  easy:   { intervalMul: 1.8, scoreMul: 0.5, label: 'Facile' },
  normal: { intervalMul: 1.0, scoreMul: 1.0, label: 'Normal' },
  hard:   { intervalMul: 0.5, scoreMul: 2.0, label: 'Difficile' },
};

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

function getDropInterval(level, diffConfig) {
  const base = Math.max(50, 800 - (level - 1) * 70);
  return Math.max(30, base * (diffConfig?.intervalMul || 1));
}

export { DIFFICULTY };
export class Game {
  constructor(options = {}) {
    this.cols = COLS;
    this.rows = ROWS;
    this.highScore = this._loadHighScore();
    this.marathonTarget = options.marathonTarget || 0; // 0 = infini
    this.setDifficulty(options.difficulty || this._loadDifficulty());
    this.reset();
  }

  _loadDifficulty() {
    try {
      const val = localStorage.getItem('tetris-difficulty');
      if (val && Object.hasOwn(DIFFICULTY, val)) return val;
    } catch { /* noop */ }
    return 'normal';
  }

  setDifficulty(name) {
    const d = DIFFICULTY[name];
    if (!d) {
      this.difficulty = 'normal';
      this._diffConfig = DIFFICULTY.normal;
      return;
    }
    this.difficulty = name;
    this._diffConfig = d;
    try { localStorage.setItem('tetris-difficulty', name); } catch { /* noop */ }
  }

  getDifficultyLabel() {
    return this._diffConfig.label;
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

  _loadBestTime() {
    const board = this._loadLeaderboard();
    return board.length > 0 ? board[0].time : 0;
  }

  _loadLeaderboard() {
    try {
      const raw = localStorage.getItem('tetris-leaderboard');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  _saveToLeaderboard(time, score) {
    try {
      const board = this._loadLeaderboard();
      board.push({ time, score, date: Date.now() });
      board.sort((a, b) => a.time - b.time);
      const top5 = board.slice(0, 5);
      localStorage.setItem('tetris-leaderboard', JSON.stringify(top5));
      return top5;
    } catch {
      return [];
    }
  }

  getLeaderboard() {
    return [...this._loadLeaderboard()];
  }

  resetScores() {
    try { localStorage.removeItem('tetris-leaderboard'); } catch { /* noop */ }
    try { localStorage.removeItem('tetris-highscore'); } catch { /* noop */ }
    this.bestTime = 0;
    this.highScore = 0;
  }

  reset() {
    this.board = createBoard();
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.bag = [];
    this._pieceId = 0;
    this.paused = false;
    this.started = false;
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
    this.marathonWon = false;
    this._startTime = 0;
    this._pauseAccum = 0;
    this._victoryTime = 0;
    this._gameOverTime = 0;
    this.bestTime = this._loadBestTime();
    this.dropTrail = [];
    this._trailTimer = 0;
    this._trailPieceName = null;
    this._shakeTimer = 0;
    this._shakeIntensity = 0;
    this._isShaking = false;
    this._lockFlashCells = [];
    this._lockFlashTimer = 0;
    this._flashTimer = 0;
    if (this.onReset) this.onReset();
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

  start() {
    if (this.started) return;
    this.started = true;
    const now = performance.now();
    this.lastDrop = now;
    this._startTime = now;
    this._pauseAccum = 0;
    if (this.onStart) this.onStart();
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
      this._gameOverTime = performance.now();
    }
  }

  holdPiece() {
    if (!this.canHold || !this.started || this.gameOver || this.paused || this.marathonWon) return false;
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
      if (collides(this.board, getShape(this.current), this.current.x, this.current.y)) {
        this.gameOver = true;
        this._gameOverTime = performance.now();
      }
    } else {
      this.hold = this.current.name;
      this.spawn();
      this.canHold = false;
    }
    if (this.gameOver && this.onGameOver) this.onGameOver();
    return true;
  }

  _actionGuard() {
    return this.started && !this.paused && !this.gameOver && !this.marathonWon && this.clearingRows.length === 0;
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
    // Capturer toutes les positions intermédiaires du trail
    const shape = getShape(this.current);
    const startX = this.current.x;
    const trailCells = [];
    // Enregistrer chaque position Y pendant la descente
    trailCells.push(...this._currentCells(shape, startX, this.current.y));
    let dropped = 0;
    while (this.moveDown()) {
      dropped++;
      if (dropped % 2 === 0) { // échantillonner toutes les 2 lignes pour pas surcharger
        trailCells.push(...this._currentCells(shape, startX, this.current.y));
      }
    }
    // Toujours ajouter la position finale
    trailCells.push(...this._currentCells(shape, startX, this.current.y));
    this.dropTrail = trailCells;
    this._trailPieceName = this.current.name;
    this._trailTimer = this._lastTimestamp || performance.now();
    this._lastActionWasRotation = wasRotation;
    this.score += dropped * 2;
    this._lock();
    this.lastDrop = performance.now();
  }

  _currentCells(shape, ox, oy) {
    const cells = [];
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) cells.push({ x: ox + x, y: oy + y });
      }
    }
    return cells;
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
    const shape = ROTATIONS[this.current.name][this.current.rotation];
    const lockCells = this._currentCells(shape, this.current.x, this.current.y);
    const lockName = this.current.name;
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
      this._lockFlashCells = lockCells;
      this._lockFlashTimer = this._lastTimestamp || performance.now();
      if (this.onLock) this.onLock(lockCells, lockName);
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
      if (isTetris) {
        this._shakeTimer = this._lastTimestamp || 1;
        this._shakeIntensity = SHAKE_PX;
        this._isShaking = true;
      }
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
      let earned = Math.floor(baseScore * multiplier * this._diffConfig.scoreMul);
      if (this.combo > 0) earned += 50 * this.combo * this.level;
      this.score += earned;
      if (this.onScoreEarned) this.onScoreEarned(earned);
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
      if (this.marathonTarget > 0 && this.lines >= this.marathonTarget && !this.marathonWon) {
        this.marathonWon = true;
        this.current = null;
        this._victoryTime = performance.now();
        this._updateHighScore();
        this.bestTime = this.elapsedTime;
        this._saveToLeaderboard(this.elapsedTime, this.score);
        this.bestTime = this._loadBestTime();
        if (this.onVictory) this.onVictory();
        return;
      }
      if (this.onLinesCleared) this.onLinesCleared(fullRows, rowSnapshots, cleared);
      if (isTSpin && this.onTSpin) this.onTSpin(cleared);
      if (isDifficult && multiplier > 1 && this.onBackToBack) this.onBackToBack();
      if (this.combo > 0 && this.onCombo) this.onCombo(this.combo);
      if (this.level > prevLevel) {
        this._flashTimer = this._lastTimestamp || 1;
        if (this.onLevelUp) this.onLevelUp(this.level);
      }
    }
    this._updateHighScore();
    this.spawn();
    if (this.gameOver && this.onGameOver) this.onGameOver();
  }

  togglePause() {
    if (this.gameOver || !this.started || this.marathonWon) return;
    this.paused = !this.paused;
    if (this.onPause) this.onPause(this.paused);
    if (!this.paused) {
      // Compenser le temps passé en pause pour lock delay et gravité
      const now = performance.now();
      const elapsed = now - this._pauseStart;
      if (this._isLocking) this._lockTimer += elapsed;
      if (this._clearTimer > 0) this._clearTimer += elapsed;
      this.lastDrop += elapsed;
      this._pauseAccum += elapsed;
    } else {
      this._pauseStart = performance.now();
    }
  }

  get elapsedTime() {
    if (!this._startTime) return 0;
    let end;
    if (this._victoryTime) end = this._victoryTime;
    else if (this.gameOver) end = this._gameOverTime || performance.now();
    else end = performance.now();
    return end - this._startTime - this._pauseAccum;
  }

  static formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const cent = Math.floor((ms % 1000) / 10);
    return `${min}:${String(sec).padStart(2, '0')}.${String(cent).padStart(2, '0')}`;
  }

  update(timestamp) {
    this._lastTimestamp = timestamp;
    if (this.gameOver || this.paused || !this.started || this.marathonWon) return;

    // Expiration du hard drop trail
    if (this.dropTrail.length > 0 && timestamp - this._trailTimer >= TRAIL_MS) {
      this.dropTrail = [];
    }
    // Expiration du lock flash
    if (this._lockFlashCells.length > 0 && timestamp - this._lockFlashTimer >= LOCK_FLASH_MS) {
      this._lockFlashCells = [];
    }

    // Expiration du screen shake
    if (this._isShaking && timestamp - this._shakeTimer >= SHAKE_MS) {
      this._isShaking = false;
      this._shakeIntensity = 0;
    }

    // Expiration du flash level up
    if (this._flashTimer !== 0 && timestamp - this._flashTimer >= FLASH_MS) {
      this._flashTimer = 0;
    }

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
    const interval = getDropInterval(this.level, this._diffConfig);
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

  get trailProgress() {
    if (this.dropTrail.length === 0 || this._trailTimer === 0) return 0;
    return Math.max(0, Math.min(1, (this._lastTimestamp - this._trailTimer) / TRAIL_MS));
  }

  get flashProgress() {
    if (this._flashTimer === 0) return 0;
    return Math.max(0, Math.min(1, 1 - (this._lastTimestamp - this._flashTimer) / FLASH_MS));
  }

  get lockFlashProgress() {
    if (this._lockFlashCells.length === 0 || this._lockFlashTimer === 0) return 0;
    return Math.max(0, Math.min(1, (this._lastTimestamp - this._lockFlashTimer) / LOCK_FLASH_MS));
  }

  get shakeOffset() {
    if (!this._isShaking) return { x: 0, y: 0 };
    const elapsed = this._lastTimestamp - this._shakeTimer;
    const progress = Math.min(1, elapsed / SHAKE_MS);
    const intensity = this._shakeIntensity * (1 - progress);
    return {
      x: (Math.random() * 2 - 1) * intensity,
      y: (Math.random() * 2 - 1) * intensity,
    };
  }

  getGhostY() {
    const shape = getShape(this.current);
    let gy = this.current.y;
    while (!collides(this.board, shape, this.current.x, gy + 1)) gy++;
    return gy;
  }

  formatStats() {
    return [
      `TETRIS — Score : ${this.score}`,
      `Niveau ${this.level} · ${this.lines} lignes`,
      `${this.stats.pieces} pièces · ${this.stats.tSpins} T-spins · combo max ×${this.stats.maxCombo}`,
    ].join('\n');
  }

  getStatsJSON() {
    return JSON.stringify({
      score: this.score,
      level: this.level,
      lines: this.lines,
      pieces: this.stats.pieces,
      tSpins: this.stats.tSpins,
      maxCombo: this.stats.maxCombo,
      difficulty: this.difficulty,
      marathonWon: this.marathonWon,
      elapsedTime: this.elapsedTime,
    }, null, 2);
  }
}
