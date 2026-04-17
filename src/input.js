const HANDLED_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space', 'KeyR', 'KeyC', 'ShiftLeft', 'ShiftRight', 'Escape', 'KeyP']);

export class Input {
  constructor(game) {
    this.game = game;
    this.keys = {};
    this.dasDelay = this._loadSetting('tetris-das-delay', 170);
    this.dasRepeat = this._loadSetting('tetris-das-repeat', 50);
    this.dasTimers = {};

    document.addEventListener('keydown', (e) => {
      if (!HANDLED_KEYS.has(e.code)) return;
      e.preventDefault();
      if (this.keys[e.code]) return;
      this.keys[e.code] = true;
      this._handleKey(e.code);
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this._clearDAS(e.code);
    });
  }

  _clearDAS(code) {
    if (this.dasTimers[code]) {
      clearTimeout(this.dasTimers[code].timeout);
      clearInterval(this.dasTimers[code].interval);
      delete this.dasTimers[code];
    }
  }

  _handleKey(code) {
    const { game } = this;
    if (game.gameOver) {
      if (code === 'KeyR') game.reset();
      // Nettoyer tous les DAS actifs
      for (const key of Object.keys(this.dasTimers)) this._clearDAS(key);
      return;
    }

    if (!game.started) {
      if (code === 'Space') game.start();
      return;
    }

    switch (code) {
      case 'Escape':
      case 'KeyP':
        game.togglePause();
        break;
      case 'ArrowLeft':
        game.moveLeft();
        this._startDAS(code, () => game.moveLeft());
        break;
      case 'ArrowRight':
        game.moveRight();
        this._startDAS(code, () => game.moveRight());
        break;
      case 'ArrowDown':
        if (game.moveDown()) game.score += 1;
        this._startDAS(code, () => { if (game.moveDown()) game.score += 1; });
        break;
      case 'ArrowUp':
        game.rotate();
        break;
      case 'Space':
        game.hardDrop();
        break;
      case 'KeyC':
      case 'ShiftLeft':
      case 'ShiftRight':
        game.holdPiece();
        break;
    }
  }

  _startDAS(code, action) {
    this._clearDAS(code);
    const timeout = setTimeout(() => {
      const interval = setInterval(action, this.dasRepeat);
      this.dasTimers[code] = { timeout, interval };
    }, this.dasDelay);
    this.dasTimers[code] = { timeout, interval: null };
  }

  _loadSetting(key, fallback) {
    try {
      const val = parseInt(localStorage.getItem(key));
      return isNaN(val) ? fallback : val;
    } catch {
      return fallback;
    }
  }

  _saveSetting(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch {
      // localStorage indisponible
    }
  }

  setDasDelay(ms) {
    this.dasDelay = Math.max(50, Math.min(500, ms));
    this._saveSetting('tetris-das-delay', this.dasDelay);
  }

  setDasRepeat(ms) {
    this.dasRepeat = Math.max(16, Math.min(200, ms));
    this._saveSetting('tetris-das-repeat', this.dasRepeat);
  }
}
