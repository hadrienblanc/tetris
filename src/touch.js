export class TouchControls {
  constructor(game, canvas) {
    this.game = game;
    this.canvas = canvas;
    this.threshold = 30;
    this.trackingId = null;
    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.trackingId = touch.identifier;
      this.startX = touch.clientX;
      this.startY = touch.clientY;
      this.startTime = Date.now();
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
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
        game.reset();
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

      if (absDy > absDx && dy > this.threshold) {
        game.hardDrop();
      } else if (absDy > absDx && dy < -this.threshold) {
        game.rotate();
      } else if (absDx > this.threshold && dx > 0) {
        game.moveRight();
      } else if (absDx > this.threshold && dx < 0) {
        game.moveLeft();
      }
    }, { passive: false });
  }
}
