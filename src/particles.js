const MAX_PARTICLES = 400;

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(row, col, color, cellSize) {
    if (this.particles.length >= MAX_PARTICLES) return;
    const cx = col * cellSize + cellSize / 2;
    const cy = row * cellSize + cellSize / 2;
    const count = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        life: 1,
        decay: 0.012 + Math.random() * 0.018,
        size: 2 + Math.random() * 5,
        color,
        round: Math.random() > 0.5,
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

  emitFirework(x, y, colors) {
    const count = 20 + Math.floor(Math.random() * 15);
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        life: 1,
        decay: 0.008 + Math.random() * 0.012,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        round: true,
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.vx *= 0.99;
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
      if (p.round) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size / 2), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }
}
