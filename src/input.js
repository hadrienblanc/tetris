export class Input {
  constructor(game) {
    this.game = game;
    this.keys = {};
    this.dasDelay = 170;
    this.dasRepeat = 50;
    this.dasTimers = {};

    document.addEventListener('keydown', (e) => {
      if (this.keys[e.code]) return;
      this.keys[e.code] = true;
      this._handleKey(e.code);
      e.preventDefault();
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (this.dasTimers[e.code]) {
        clearTimeout(this.dasTimers[e.code].timeout);
        clearInterval(this.dasTimers[e.code].interval);
        delete this.dasTimers[e.code];
      }
    });
  }

  _handleKey(code) {
    const { game } = this;
    if (game.gameOver) {
      if (code === 'KeyR') game.reset();
      return;
    }

    switch (code) {
      case 'ArrowLeft':
        game.moveLeft();
        this._startDAS(code, () => game.moveLeft());
        break;
      case 'ArrowRight':
        game.moveRight();
        this._startDAS(code, () => game.moveRight());
        break;
      case 'ArrowDown':
        game.moveDown();
        game.score += 1;
        this._startDAS(code, () => { game.moveDown(); game.score += 1; });
        break;
      case 'ArrowUp':
        game.rotate();
        break;
      case 'Space':
        game.hardDrop();
        break;
    }
  }

  _startDAS(code, action) {
    if (this.dasTimers[code]) {
      clearTimeout(this.dasTimers[code].timeout);
      clearInterval(this.dasTimers[code].interval);
    }
    const timeout = setTimeout(() => {
      const interval = setInterval(action, this.dasRepeat);
      this.dasTimers[code] = { timeout, interval };
    }, this.dasDelay);
    this.dasTimers[code] = { timeout, interval: null };
  }
}
