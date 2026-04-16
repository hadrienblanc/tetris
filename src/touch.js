export class TouchControls {
  constructor(game, canvas) {
    this.game = game;
    this.canvas = canvas;
    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;
    this.threshold = 30;

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.startX = touch.clientX;
      this.startY = touch.clientY;
      this.startTime = Date.now();
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (game.gameOver) {
        game.reset();
        return;
      }

      const touch = e.changedTouches[0];
      const dx = touch.clientX - this.startX;
      const dy = touch.clientY - this.startY;
      const dt = Date.now() - this.startTime;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Tap court = action basée sur position horizontale
      if (absDx < this.threshold && absDy < this.threshold && dt < 300) {
        const rect = this.canvas.getBoundingClientRect();
        const relX = touch.clientX - rect.left;
        const half = rect.width / 2;
        if (relX < half * 0.4) {
          game.moveLeft();
        } else if (relX > half * 1.6) {
          game.moveRight();
        } else {
          game.rotate();
        }
        return;
      }

      // Swipe
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
