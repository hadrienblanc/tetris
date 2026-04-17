export class TouchControls {
  constructor(game, canvas, options = {}) {
    this.game = game;
    this.canvas = canvas;
    this._isShareHit = options.isShareHit || (() => false);
    this.threshold = 30;
    this.trackingId = null;
    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;
    this.twoFingerTap = false;

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      // Détecter 2 doigts uniquement au début d'un nouveau geste
      this.twoFingerTap = e.targetTouches.length >= 2 && this.trackingId === null;
      if (this.twoFingerTap) {
        this.trackingId = null;
        return;
      }
      const touch = e.touches[0];
      this.trackingId = touch.identifier;
      this.startX = touch.clientX;
      this.startY = touch.clientY;
      this.startTime = Date.now();
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchcancel', () => {
      this.trackingId = null;
      this.twoFingerTap = false;
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();

      // Deux doigts tap = hard drop
      if (this.twoFingerTap) {
        this.twoFingerTap = false;
        if (game.gameOver) { game.reset(); return; }
        if (!game.started) { game.start(); return; }
        game.hardDrop();
        return;
      }

      // Trouver le bon touch par identifier
      let touch = null;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.trackingId) {
          touch = e.changedTouches[i];
          break;
        }
      }
      if (!touch) return;
      this.trackingId = null;

      if (game.gameOver) {
        if (this._isShareHit(touch.clientX, touch.clientY)) return;
        game.reset();
        return;
      }

      if (!game.started) {
        game.start();
        return;
      }

      const dx = touch.clientX - this.startX;
      const dy = touch.clientY - this.startY;
      const dt = Date.now() - this.startTime;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Tap court
      if (absDx < this.threshold && absDy < this.threshold && dt < 300) {
        const rect = this.canvas.getBoundingClientRect();
        const relX = touch.clientX - rect.left;
        const third = rect.width / 3;
        if (relX < third) {
          game.moveLeft();
        } else if (relX > third * 2) {
          game.moveRight();
        } else {
          game.rotate();
        }
        return;
      }

      // Swipe avec plafond de temps
      if (dt > 500) return;

      if (absDy > absDx && dy < -this.threshold * 3) {
        // Swipe haut long = hold
        game.holdPiece();
      } else if (absDy > absDx && dy < -this.threshold) {
        // Swipe haut court = rotate
        game.rotate();
      } else if (absDy > absDx && dy > this.threshold) {
        game.hardDrop();
      } else if (absDx > this.threshold && dx > 0) {
        game.moveRight();
      } else if (absDx > this.threshold && dx < 0) {
        game.moveLeft();
      }
    }, { passive: false });
  }
}
