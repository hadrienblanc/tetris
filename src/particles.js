const MAX_PARTICLES = 200;

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(row, col, color, cellSize) {
    if (this.particles.length >= MAX_PARTICLES) return;
    const cx = col * cellSize + cellSize / 2;
    const cy = row * cellSize + cellSize / 2;
    const count = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        decay: 0.015 + Math.random() * 0.02,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }

  emitRow(row, board, cellSize, theme) {
    for (let col = 0; col < board[row].length; col++) {
      const name = board[row][col];
      const color = theme?.cells?.[name] || '#fff';
      this.emit(row, col, color, cellSize);
    }
  }

  emitRowFromSnapshot(row, snapshot, cellSize, theme) {
    for (let col = 0; col < snapshot.length; col++) {
      const name = snapshot[col];
      const color = theme?.cells?.[name] || '#fff';
      this.emit(row, col, color, cellSize);
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // gravity
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}
