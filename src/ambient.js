const AMBIENT_TYPES = {
  snow: {
    init(p, w, h, cfg) {
      p.x = Math.random() * w;
      p.y = Math.random() * h;
      p.size = 1.5 + Math.random() * 2.5;
      p.vx = (Math.random() - 0.5) * 0.5;
      p.vy = cfg.speed * (0.5 + Math.random());
      p.wobble = Math.random() * Math.PI * 2;
    },
    update(p, w, h, cfg) {
      p.wobble += 0.02;
      p.x += p.vx + Math.sin(p.wobble) * 0.3;
      p.y += p.vy;
      if (p.y > h) { p.y = -p.size; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
    },
    draw(ctx, p, color) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  rain: {
    init(p, w, h, cfg) {
      p.x = Math.random() * w;
      p.y = Math.random() * h;
      p.len = 6 + Math.random() * 10;
      p.vy = cfg.speed * (0.7 + Math.random() * 0.6);
      p.vx = -0.3;
    },
    update(p, w, h, cfg) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > h) { p.y = -p.len; p.x = Math.random() * w; }
    },
    draw(ctx, p, color) {
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * 2, p.y + p.len);
      ctx.stroke();
    },
  },
  sparkle: {
    init(p, w, h, cfg) {
      p.x = Math.random() * w;
      p.y = Math.random() * h;
      p.size = 1 + Math.random() * 2;
      p.phase = Math.random() * Math.PI * 2;
      p.speed = 0.02 + Math.random() * 0.03;
    },
    update(p, w, h) {
      p.phase += p.speed;
    },
    draw(ctx, p, color) {
      const alpha = Math.max(0, Math.sin(p.phase)) * 0.6;
      if (alpha < 0.05) return;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  bubble: {
    init(p, w, h, cfg) {
      p.x = Math.random() * w;
      p.y = Math.random() * h;
      p.size = 2 + Math.random() * 4;
      p.vy = -cfg.speed * (0.3 + Math.random() * 0.7);
      p.wobble = Math.random() * Math.PI * 2;
    },
    update(p, w, h, cfg) {
      p.wobble += 0.03;
      p.x += Math.sin(p.wobble) * 0.4;
      p.y += p.vy;
      if (p.y < -p.size) { p.y = h + p.size; p.x = Math.random() * w; }
    },
    draw(ctx, p, color) {
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.stroke();
      // Highlight
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  leaf: {
    init(p, w, h, cfg) {
      p.x = Math.random() * w;
      p.y = Math.random() * h;
      p.size = 2 + Math.random() * 3;
      p.vy = cfg.speed * (0.3 + Math.random() * 0.7);
      p.vx = 0.3 + Math.random() * 0.4;
      p.rot = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 0.04;
    },
    update(p, w, h) {
      p.rot += p.rotSpeed;
      p.x += p.vx + Math.sin(p.rot) * 0.3;
      p.y += p.vy;
      if (p.y > h + 5) { p.y = -5; p.x = Math.random() * w; }
      if (p.x > w + 10) p.x = -10;
    },
    draw(ctx, p, color) {
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    },
  },
  ember: {
    init(p, w, h, cfg) {
      p.x = Math.random() * w;
      p.y = h + Math.random() * 20;
      p.size = 1 + Math.random() * 2;
      p.vy = -cfg.speed * (0.5 + Math.random());
      p.vx = (Math.random() - 0.5) * 0.5;
      p.life = 0.5 + Math.random() * 0.5;
    },
    update(p, w, h, cfg) {
      p.x += p.vx + Math.sin(p.y * 0.02) * 0.2;
      p.y += p.vy;
      p.life -= 0.005;
      if (p.life <= 0 || p.y < -10) {
        p.x = Math.random() * w;
        p.y = h + 5;
        p.life = 0.5 + Math.random() * 0.5;
      }
    },
    draw(ctx, p, color) {
      ctx.globalAlpha = Math.max(0, p.life) * 0.6;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  dust: {
    init(p, w, h, cfg) {
      p.x = Math.random() * w;
      p.y = Math.random() * h;
      p.size = 1 + Math.random() * 2;
      p.vx = (Math.random() - 0.5) * cfg.speed;
      p.vy = (Math.random() - 0.5) * cfg.speed;
      p.phase = Math.random() * Math.PI * 2;
    },
    update(p, w, h) {
      p.phase += 0.01;
      p.x += p.vx + Math.sin(p.phase) * 0.1;
      p.y += p.vy + Math.cos(p.phase) * 0.1;
      if (p.x < -5) p.x = w + 5;
      if (p.x > w + 5) p.x = -5;
      if (p.y < -5) p.y = h + 5;
      if (p.y > h + 5) p.y = -5;
    },
    draw(ctx, p, color) {
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  pixel: {
    init(p, w, h, cfg) {
      p.x = Math.random() * w;
      p.y = Math.random() * h;
      p.size = 2 + Math.random() * 2;
      p.phase = Math.random() * Math.PI * 2;
      p.blinkSpeed = 0.01 + Math.random() * 0.02;
    },
    update(p, w, h) {
      p.phase += p.blinkSpeed;
    },
    draw(ctx, p, color) {
      const alpha = Math.max(0, Math.sin(p.phase)) * 0.3;
      if (alpha < 0.05) return;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    },
  },
};

export class AmbientSystem {
  constructor() {
    this.particles = [];
    this._currentType = null;
    this._w = 0;
    this._h = 0;
  }

  resize(w, h) {
    this._w = w;
    this._h = h;
  }

  setTheme(theme) {
    const cfg = theme?.ambient;
    if (!cfg) {
      this.particles = [];
      this._currentType = null;
      return;
    }
    if (this._currentType === cfg.type && this.particles.length > 0) return;
    this._currentType = cfg.type;
    this._rebuild(cfg);
  }

  _rebuild(cfg) {
    const handler = AMBIENT_TYPES[cfg.type];
    if (!handler) { this.particles = []; return; }
    this.particles = [];
    for (let i = 0; i < cfg.count; i++) {
      const p = {};
      handler.init(p, this._w, this._h, cfg);
      this.particles.push(p);
    }
  }

  update(theme) {
    const cfg = theme?.ambient;
    if (!cfg) return;
    const handler = AMBIENT_TYPES[cfg.type];
    if (!handler) return;
    for (const p of this.particles) {
      handler.update(p, this._w, this._h, cfg);
    }
  }

  draw(ctx, theme) {
    const cfg = theme?.ambient;
    if (!cfg) return;
    const handler = AMBIENT_TYPES[cfg.type];
    if (!handler) return;
    ctx.save();
    for (const p of this.particles) {
      handler.draw(ctx, p, cfg.color);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

export { AMBIENT_TYPES };
