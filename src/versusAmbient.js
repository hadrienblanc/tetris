// VersusAmbient — 10 animations d'arrière-plan arcade qui cyclent toutes les 25s,
// indépendantes du ThemeManager (le versus garde son identité néon cyan/magenta
// quel que soit le thème actif).
//
// Chaque animation implémente { init(w,h), update(dt,w,h), draw(ctx,w,h) }.
// Le rendu tourne cappé à 30fps sur un canvas fullscreen en z-index:-1.
// Les transitions se font en fade-through-black (0.75s noir → 0.75s clair)
// pour rester compatible avec n'importe quelle animation sans la contraindre
// à respecter un alpha externe.

const CYCLE_MS = 25_000;
const FADE_MS = 1500;
const TARGET_DT = 1 / 30;

const CYAN = '#00eaff';
const MAGENTA = '#ff2d95';

function rand(min, max) { return min + Math.random() * (max - min); }
function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// === 1. Starfield ===
class Starfield {
  constructor() { this.stars = []; }
  init(w, h) {
    this.stars = [];
    for (let i = 0; i < 180; i++) {
      const layer = Math.floor(Math.random() * 3);
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        layer,
        size: 0.8 + layer * 0.6,
      });
    }
  }
  update(dt, w, h) {
    for (const s of this.stars) {
      const speed = 15 + s.layer * 35;
      s.y += speed * dt;
      if (s.y > h + 2) { s.y = -2; s.x = Math.random() * w; }
    }
  }
  draw(ctx, w, h) {
    for (const s of this.stars) {
      const brightness = 0.35 + s.layer * 0.25;
      ctx.fillStyle = `rgba(255,255,255,${brightness})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
  }
}

// === 2. Comets ===
class Comets {
  constructor() { this.comets = []; this.spawnT = 0.5; }
  init() { this.comets = []; this.spawnT = 0.5; }
  update(dt, w, h) {
    this.spawnT -= dt;
    while (this.spawnT <= 0) {
      const p1 = Math.random() < 0.5;
      this.comets.push({
        x: Math.random() * w,
        y: -20,
        vx: rand(-120, 120),
        vy: rand(320, 560),
        color: p1 ? CYAN : MAGENTA,
      });
      this.spawnT += rand(1.2, 3.2);
    }
    for (const c of this.comets) {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
    }
    this.comets = this.comets.filter(c => c.y < h + 100 && c.x > -100 && c.x < w + 100);
  }
  draw(ctx, w, h) {
    for (const c of this.comets) {
      const tx = c.x - c.vx * 0.15;
      const ty = c.y - c.vy * 0.15;
      const grad = ctx.createLinearGradient(c.x, c.y, tx, ty);
      grad.addColorStop(0, c.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.shadowBlur = 10;
      ctx.shadowColor = c.color;
      ctx.fillStyle = '#fff';
      ctx.fillRect(c.x - 2, c.y - 2, 4, 4);
      ctx.shadowBlur = 0;
    }
  }
}

// === 3. Ghost tetrominos ===
const TETRO_SHAPES = [
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,0],[1,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]],
  [[0,1,1],[1,1,0]],
  [[1,1,0],[0,1,1]],
];
const TETRO_COLORS = [CYAN, MAGENTA, '#b967ff', '#ffff66', '#66ff99'];

class GhostTetrominos {
  constructor() { this.pieces = []; }
  init(w, h) {
    this.pieces = [];
    for (let i = 0; i < 18; i++) this._spawn(w, h, true);
  }
  _spawn(w, h, initial) {
    this.pieces.push({
      shape: randChoice(TETRO_SHAPES),
      x: Math.random() * w,
      y: initial ? Math.random() * h : -80,
      vy: rand(18, 55),
      rot: Math.random() * Math.PI * 2,
      vRot: rand(-0.6, 0.6),
      size: rand(20, 36),
      color: randChoice(TETRO_COLORS),
    });
  }
  update(dt, w, h) {
    for (const p of this.pieces) {
      p.y += p.vy * dt;
      p.rot += p.vRot * dt;
    }
    this.pieces = this.pieces.filter(p => p.y < h + 100);
    while (this.pieces.length < 18) this._spawn(w, h, false);
  }
  draw(ctx, w, h) {
    for (const p of this.pieces) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      const s = p.size;
      const rows = p.shape.length;
      const cols = p.shape[0].length;
      const offX = -cols * s / 2;
      const offY = -rows * s / 2;
      ctx.fillStyle = p.color + '30';
      ctx.strokeStyle = p.color + '80';
      ctx.lineWidth = 1;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (p.shape[y][x]) {
            const px = offX + x * s;
            const py = offY + y * s;
            ctx.fillRect(px, py, s - 1, s - 1);
            ctx.strokeRect(px, py, s - 1, s - 1);
          }
        }
      }
      ctx.restore();
    }
  }
}

// === 4. Vaporwave grid ===
class VaporwaveGrid {
  constructor() { this.offset = 0; }
  init() { this.offset = 0; }
  update(dt) { this.offset = (this.offset + dt * 60) % 80; }
  draw(ctx, w, h) {
    const horizonY = h * 0.55;
    const sunR = Math.min(w, h) * 0.18;
    const sunX = w / 2;
    const sunY = horizonY - sunR * 0.3;
    const sunGrad = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY + sunR);
    sunGrad.addColorStop(0, '#ff66aa');
    sunGrad.addColorStop(0.5, '#ff8844');
    sunGrad.addColorStop(1, '#ffcc33');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();
    // bandes horizontales sur le soleil
    ctx.fillStyle = 'rgba(8,8,26,0.9)';
    for (let i = 0; i < 5; i++) {
      const y = sunY - sunR * 0.1 + i * sunR * 0.22;
      if (y < sunY + sunR * 0.95) {
        const half = Math.sqrt(Math.max(0, sunR * sunR - (y - sunY) * (y - sunY)));
        ctx.fillRect(sunX - half, y, half * 2, 2);
      }
    }
    ctx.strokeStyle = 'rgba(255,45,149,0.8)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#ff2d95';
    // lignes horizontales perspective
    for (let i = 0; i < 16; i++) {
      const t = (i * 80 + this.offset) / (16 * 80);
      const y = horizonY + Math.pow(t, 2) * (h - horizonY);
      if (y > h) continue;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // lignes verticales radiantes
    for (let i = -10; i <= 10; i++) {
      const x = w / 2 + i * w / 20;
      ctx.beginPath();
      ctx.moveTo(x, horizonY);
      ctx.lineTo(w / 2 + i * w, h);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }
}

// === 5. Matrix rain ===
const MATRIX_CHARS = 'アァカサタナハマヤラワガザダバパイィキシチニヒミリヰギジヂビピウヴクスツヌフムユルグズヅブプ0123456789ABCDEF'.split('');
class MatrixRain {
  constructor() { this.cols = []; }
  init(w, h) {
    const colW = 14;
    const count = Math.floor(w / colW);
    this.cols = [];
    for (let i = 0; i < count; i++) {
      this.cols.push({
        x: i * colW,
        y: Math.random() * h,
        speed: rand(180, 380),
        chars: Array.from({ length: 15 }, () => randChoice(MATRIX_CHARS)),
        swapT: rand(0.05, 0.25),
      });
    }
  }
  update(dt, w, h) {
    for (const c of this.cols) {
      c.y += c.speed * dt;
      if (c.y - c.chars.length * 16 > h) {
        c.y = -rand(0, h / 2);
        c.speed = rand(180, 380);
      }
      c.swapT -= dt;
      if (c.swapT <= 0) {
        c.chars[Math.floor(Math.random() * c.chars.length)] = randChoice(MATRIX_CHARS);
        c.swapT = rand(0.05, 0.25);
      }
    }
  }
  draw(ctx, w, h) {
    ctx.font = '14px monospace';
    for (const c of this.cols) {
      for (let j = 0; j < c.chars.length; j++) {
        const y = c.y - j * 16;
        if (y < -16 || y > h + 16) continue;
        if (j === 0) ctx.fillStyle = '#d8ffd8';
        else {
          const a = Math.max(0, 1 - j / c.chars.length);
          ctx.fillStyle = `rgba(40,220,80,${a})`;
        }
        ctx.fillText(c.chars[j], c.x, y);
      }
    }
  }
}

// === 6. Rockets ===
class Rockets {
  constructor() { this.rockets = []; this.spawnT = 0.3; }
  init() { this.rockets = []; this.spawnT = 0.3; }
  update(dt, w, h) {
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.rockets.push({
        x: Math.random() * w,
        y: h + 20,
        vx: rand(-40, 40),
        vy: -rand(180, 320),
        particles: [],
        color: randChoice([CYAN, MAGENTA, '#ff8800', '#ffff66', '#66ff99']),
      });
      this.spawnT = rand(0.4, 1.2);
    }
    for (const r of this.rockets) {
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      if (Math.random() < 0.9) {
        r.particles.push({ x: r.x + rand(-2, 2), y: r.y + 6, life: 1 });
      }
      for (const p of r.particles) {
        p.life -= dt * 2.2;
        p.y += 22 * dt;
      }
      r.particles = r.particles.filter(p => p.life > 0);
    }
    this.rockets = this.rockets.filter(r => r.y > -60);
  }
  draw(ctx) {
    for (const r of this.rockets) {
      for (const p of r.particles) {
        const a = p.life * 0.8;
        ctx.fillStyle = `rgba(255,170,40,${a})`;
        ctx.fillRect(p.x - 2, p.y, 3, 4);
      }
      ctx.fillStyle = r.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = r.color;
      ctx.fillRect(r.x - 2, r.y - 8, 4, 10);
      ctx.beginPath();
      ctx.moveTo(r.x - 2, r.y - 8);
      ctx.lineTo(r.x + 2, r.y - 8);
      ctx.lineTo(r.x, r.y - 14);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

// === 7. Fireworks ===
const FIREWORK_COLORS = ['#ff2d95', '#00eaff', '#ffff66', '#66ff99', '#ff8800', '#ffffff', '#b967ff'];
class Fireworks {
  constructor() { this.bursts = []; this.spawnT = 0.3; }
  init() { this.bursts = []; this.spawnT = 0.3; }
  update(dt, w, h) {
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      const cx = rand(w * 0.15, w * 0.85);
      const cy = rand(h * 0.15, h * 0.6);
      const color = randChoice(FIREWORK_COLORS);
      const count = Math.floor(rand(30, 55));
      const parts = [];
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + rand(-0.15, 0.15);
        const v = rand(90, 240);
        parts.push({
          x: cx, y: cy,
          vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          life: 1, color,
        });
      }
      this.bursts.push({ parts });
      this.spawnT = rand(0.5, 1.2);
    }
    for (const b of this.bursts) {
      for (const p of b.parts) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 70 * dt;
        p.vx *= 0.98; p.vy *= 0.98;
        p.life -= dt * 0.75;
      }
      b.parts = b.parts.filter(p => p.life > 0);
    }
    this.bursts = this.bursts.filter(b => b.parts.length > 0);
  }
  draw(ctx) {
    for (const b of this.bursts) {
      for (const p of b.parts) {
        const rgb = hexToRgb(p.color);
        ctx.fillStyle = `rgba(${rgb},${Math.max(0, p.life)})`;
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      }
    }
  }
}

// helper réutilisable
const _hexCache = new Map();
function hexToRgb(hex) {
  if (_hexCache.has(hex)) return _hexCache.get(hex);
  const h = hex.replace('#', '');
  const n = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const out = `${r},${g},${b}`;
  _hexCache.set(hex, out);
  return out;
}

// === 8. Plasma waves ===
class PlasmaWaves {
  constructor() { this.t = 0; }
  init() { this.t = 0; }
  update(dt) { this.t += dt; }
  draw(ctx, w, h) {
    const waves = [
      { amp: 40, freq: 0.008, phase: 0,            speed: 1.2, color: CYAN,      offY: h * 0.5 },
      { amp: 55, freq: 0.006, phase: Math.PI,      speed: 0.8, color: MAGENTA,   offY: h * 0.55 },
      { amp: 32, freq: 0.012, phase: Math.PI / 2,  speed: 1.6, color: '#b967ff', offY: h * 0.45 },
    ];
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 14;
    for (const wv of waves) {
      const rgb = hexToRgb(wv.color);
      ctx.strokeStyle = `rgba(${rgb},0.55)`;
      ctx.shadowColor = wv.color;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = wv.offY
          + Math.sin(x * wv.freq + wv.phase + this.t * wv.speed) * wv.amp
          + Math.sin(x * wv.freq * 2.7 + this.t * wv.speed * 0.6) * wv.amp * 0.4;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }
}

// === 9. Asteroids ===
class Asteroids {
  constructor() { this.rocks = []; }
  init(w, h) {
    this.rocks = [];
    for (let i = 0; i < 12; i++) this._spawn(w, h, true);
  }
  _spawn(w, h, initial) {
    const verts = Math.floor(rand(7, 11));
    const baseR = rand(20, 55);
    const shape = [];
    for (let i = 0; i < verts; i++) {
      const a = (i / verts) * Math.PI * 2;
      const r = baseR * rand(0.7, 1.15);
      shape.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    const angle = rand(0, Math.PI * 2);
    const speed = rand(10, 40);
    this.rocks.push({
      x: initial ? Math.random() * w : rand(-50, w + 50),
      y: initial ? Math.random() * h : -baseR - 10,
      vx: Math.cos(angle) * speed,
      vy: Math.abs(Math.sin(angle) * speed) + 8,
      rot: Math.random() * Math.PI * 2,
      vRot: rand(-0.4, 0.4),
      shape,
      color: randChoice([CYAN, MAGENTA, '#ffffff']),
    });
  }
  update(dt, w, h) {
    for (const r of this.rocks) {
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.rot += r.vRot * dt;
    }
    this.rocks = this.rocks.filter(r => r.y < h + 80 && r.x > -100 && r.x < w + 100);
    while (this.rocks.length < 12) this._spawn(w, h, false);
  }
  draw(ctx) {
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 6;
    for (const r of this.rocks) {
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.rot);
      const rgb = hexToRgb(r.color);
      ctx.strokeStyle = `rgba(${rgb},0.75)`;
      ctx.shadowColor = r.color;
      ctx.beginPath();
      for (let i = 0; i < r.shape.length; i++) {
        const p = r.shape[i];
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
    ctx.shadowBlur = 0;
  }
}

// === 10. Wormhole ===
class Wormhole {
  constructor() { this.rings = []; this.t = 0; }
  init() {
    this.rings = [];
    this.t = 0;
    for (let i = 0; i < 25; i++) this.rings.push({ age: (i / 25) * 4 });
  }
  update(dt) {
    this.t += dt;
    for (const r of this.rings) r.age += dt * 0.8;
    for (const r of this.rings) {
      if (r.age >= 4) r.age = 0;
    }
  }
  draw(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.hypot(w, h) / 2;
    ctx.lineWidth = 2;
    for (const r of this.rings) {
      const t = r.age / 4;
      const radius = t * maxR;
      const alpha = Math.sin(t * Math.PI) * 0.55;
      if (alpha <= 0.01) continue;
      const color = r.age < 2 ? CYAN : MAGENTA;
      const rgb = hexToRgb(color);
      ctx.strokeStyle = `rgba(${rgb},${alpha})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius, radius * 0.65, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // lignes radiantes qui tournent
    ctx.strokeStyle = 'rgba(185,103,255,0.22)';
    ctx.shadowBlur = 0;
    const lines = 12;
    for (let i = 0; i < lines; i++) {
      const a = (i / lines) * Math.PI * 2 + this.t * 0.15;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
      ctx.stroke();
    }
  }
}

// === VersusAmbient orchestrator ===
export const ANIMATION_LABELS = [
  'Starfield', 'Comets', 'Ghost Pieces', 'Vaporwave',
  'Matrix', 'Rockets', 'Fireworks', 'Plasma',
  'Asteroids', 'Wormhole',
];

export class VersusAmbient {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.w = 0; this.h = 0;
    this.animations = [
      new Starfield(),
      new Comets(),
      new GhostTetrominos(),
      new VaporwaveGrid(),
      new MatrixRain(),
      new Rockets(),
      new Fireworks(),
      new PlasmaWaves(),
      new Asteroids(),
      new Wormhole(),
    ];
    this.currentIndex = 0;
    this.fadeFrom = -1;
    this.fadeTimer = 0;
    this.cycleTimer = CYCLE_MS / 1000;
    this.running = false;
    this._lastTime = 0;
    this._accum = 0;
    this.onLabelChange = null;
  }

  get label() { return ANIMATION_LABELS[this.currentIndex]; }

  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.w = w; this.h = h;
    for (const a of this.animations) a.init(w, h);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._lastTime = performance.now();
    this._accum = 0;
    if (this.onLabelChange) this.onLabelChange(this.label);
  }

  stop() { this.running = false; }

  setIndex(i, { instant = false } = {}) {
    const idx = ((i % this.animations.length) + this.animations.length) % this.animations.length;
    if (idx === this.currentIndex && !instant) return;
    if (instant || !this.running) {
      this.currentIndex = idx;
      this.fadeFrom = -1;
      this.fadeTimer = 0;
      this.animations[idx].init(this.w, this.h);
    } else {
      this.fadeFrom = this.currentIndex;
      this.currentIndex = idx;
      this.fadeTimer = FADE_MS / 1000;
      this.animations[idx].init(this.w, this.h);
    }
    this.cycleTimer = CYCLE_MS / 1000;
    if (this.onLabelChange) this.onLabelChange(this.label);
  }

  next() { this.setIndex(this.currentIndex + 1); }

  update(timestamp) {
    if (!this.running) return;
    let dt = (timestamp - this._lastTime) / 1000;
    if (dt < 0 || dt > 0.25) dt = TARGET_DT;
    this._lastTime = timestamp;

    this._accum += dt;
    if (this._accum < TARGET_DT) return;
    const step = this._accum;
    this._accum = 0;

    this.cycleTimer -= step;
    if (this.cycleTimer <= 0) this.next();

    if (this.fadeFrom >= 0) {
      this.fadeTimer -= step;
      if (this.fadeTimer <= 0) { this.fadeFrom = -1; this.fadeTimer = 0; }
    }

    this.animations[this.currentIndex].update(step, this.w, this.h);
    if (this.fadeFrom >= 0) this.animations[this.fadeFrom].update(step, this.w, this.h);

    this._draw();
  }

  _draw() {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    ctx.clearRect(0, 0, w, h);

    if (this.fadeFrom >= 0) {
      const fadeTotal = FADE_MS / 1000;
      const t = 1 - this.fadeTimer / fadeTotal; // 0 → 1
      if (t < 0.5) {
        // première moitié : ancienne anim, voile noir de 0 → 1
        this.animations[this.fadeFrom].draw(ctx, w, h);
        ctx.fillStyle = `rgba(0,0,0,${t * 2})`;
        ctx.fillRect(0, 0, w, h);
      } else {
        // seconde moitié : nouvelle anim, voile noir de 1 → 0
        this.animations[this.currentIndex].draw(ctx, w, h);
        ctx.fillStyle = `rgba(0,0,0,${(1 - t) * 2})`;
        ctx.fillRect(0, 0, w, h);
      }
    } else {
      this.animations[this.currentIndex].draw(ctx, w, h);
    }
  }
}
