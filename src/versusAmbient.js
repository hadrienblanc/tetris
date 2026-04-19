// VersusAmbient — 10 mini-scènes d'arrière-plan arcade qui cyclent toutes les 10s,
// indépendantes du ThemeManager (le versus garde son identité néon cyan/magenta
// quel que soit le thème actif).
//
// Chaque animation est une mini-cinématique : elle superpose plusieurs couches
// (fond, éléments principaux, premier plan) et déclenche des événements
// ponctuels pendant son cycle de vie (ex: étoile filante, satellite, beat drop).
// Les transitions entre scènes se font en fade-through-black (0.75s noir →
// 0.75s clair) pour rester compatibles avec n'importe quelle scène sans la
// contraindre à respecter un alpha externe.

const CYCLE_MS = 10_000;
const FADE_MS = 1500;
const TARGET_DT = 1 / 30;

const CYAN = '#00eaff';
const MAGENTA = '#ff2d95';

function rand(min, max) { return min + Math.random() * (max - min); }
function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// === 1. Starfield ===
// Couches : nébuleuses (fond) → étoiles parallax (3 profondeurs) → étoiles filantes (événement)
// Événement : étoile qui pulse brièvement (flare) de temps en temps.
class Starfield {
  constructor() { this.stars = []; this.nebulae = []; this.shooting = []; this.flareT = 0; this.shootT = 0; }
  init(w, h) {
    this.stars = [];
    for (let i = 0; i < 400; i++) {
      const layer = Math.floor(Math.random() * 3);
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        layer,
        size: 0.8 + layer * 0.6,
        flare: 0,
      });
    }
    this.nebulae = [];
    for (let i = 0; i < 6; i++) {
      this.nebulae.push({
        x: Math.random() * w,
        y: Math.random() * h,
        rx: rand(180, 380),
        ry: rand(120, 260),
        color: randChoice(['138,43,226', '30,144,255', '219,112,147', '255,100,150', '80,220,255']),
        vx: rand(-6, 6),
        vy: rand(5, 15),
      });
    }
    this.shooting = [];
    this.flareT = rand(0.2, 0.8);
    this.shootT = rand(0.5, 1.5);
  }
  update(dt, w, h) {
    for (const n of this.nebulae) {
      n.x += n.vx * dt; n.y += n.vy * dt;
      if (n.y - n.ry > h) { n.y = -n.ry; n.x = Math.random() * w; }
    }
    for (const s of this.stars) {
      const speed = 15 + s.layer * 35;
      s.y += speed * dt;
      if (s.y > h + 2) { s.y = -2; s.x = Math.random() * w; }
      if (s.flare > 0) s.flare -= dt * 2;
    }
    this.flareT -= dt;
    if (this.flareT <= 0) {
      for (let i = 0; i < 3; i++) {
        const candidate = this.stars[Math.floor(Math.random() * this.stars.length)];
        if (candidate) candidate.flare = 1;
      }
      this.flareT = rand(0.15, 0.6);
    }
    this.shootT -= dt;
    while (this.shootT <= 0) {
      this.shooting.push({
        x: Math.random() * w,
        y: -20,
        vx: rand(-900, 900),
        vy: rand(700, 1100),
        life: 1,
      });
      this.shootT += rand(0.4, 1.2);
    }
    for (const s of this.shooting) {
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.life -= dt * 0.9;
    }
    this.shooting = this.shooting.filter(s => s.life > 0 && s.y < h + 50);
  }
  draw(ctx, w, h) {
    // nébuleuses
    for (const n of this.nebulae) {
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, Math.max(n.rx, n.ry));
      grad.addColorStop(0, `rgba(${n.color},0.25)`);
      grad.addColorStop(1, `rgba(${n.color},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(n.x, n.y, n.rx, n.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // étoiles
    for (const s of this.stars) {
      const brightness = 0.35 + s.layer * 0.25 + s.flare * 0.6;
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, brightness)})`;
      const size = s.size + s.flare * 3;
      ctx.fillRect(s.x, s.y, size, size);
      if (s.flare > 0.3) {
        ctx.strokeStyle = `rgba(255,255,255,${s.flare * 0.6})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(s.x - size * 2, s.y + size / 2);
        ctx.lineTo(s.x + size * 3, s.y + size / 2);
        ctx.moveTo(s.x + size / 2, s.y - size * 2);
        ctx.lineTo(s.x + size / 2, s.y + size * 3);
        ctx.stroke();
      }
    }
    // étoiles filantes
    for (const s of this.shooting) {
      const tx = s.x - s.vx * 0.06;
      const ty = s.y - s.vy * 0.06;
      const grad = ctx.createLinearGradient(s.x, s.y, tx, ty);
      grad.addColorStop(0, `rgba(255,255,255,${s.life})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }
  }
}

// === 2. Comets ===
// Couches : champ d'étoiles statique de fond → pluie de comètes → boss comet occasionnel
// Événement : boss comet massif traverse lentement en diagonale toutes les ~7s.
class Comets {
  constructor() { this.comets = []; this.bgStars = []; this.bosses = []; this.spawnT = 0.5; this.bossT = 3; }
  init(w, h) {
    this.comets = [];
    this.spawnT = 0.1;
    this.bossT = rand(0.8, 2);
    this.bosses = [];
    this.bgStars = [];
    for (let i = 0; i < 150; i++) {
      this.bgStars.push({ x: Math.random() * w, y: Math.random() * h, size: Math.random() * 1.6 });
    }
  }
  update(dt, w, h) {
    this.spawnT -= dt;
    while (this.spawnT <= 0) {
      const p1 = Math.random() < 0.5;
      this.comets.push({
        x: Math.random() * w,
        y: -20,
        vx: rand(-150, 150),
        vy: rand(320, 620),
        color: p1 ? CYAN : MAGENTA,
        sparkle: [],
        sparkleT: 0,
      });
      this.spawnT += rand(0.15, 0.5);
    }
    for (const c of this.comets) {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.sparkleT -= dt;
      if (c.sparkleT <= 0) {
        c.sparkle.push({ x: c.x + rand(-4, 4), y: c.y + rand(-4, 4), life: 1 });
        c.sparkleT = 0.04;
      }
      for (const s of c.sparkle) s.life -= dt * 2.5;
      c.sparkle = c.sparkle.filter(s => s.life > 0);
    }
    this.comets = this.comets.filter(c => c.y < h + 100 && c.x > -100 && c.x < w + 100);
    // boss comets (plusieurs en parallèle)
    this.bossT -= dt;
    if (this.bossT <= 0 && this.bosses.length < 3) {
      const fromLeft = Math.random() < 0.5;
      this.bosses.push({
        x: fromLeft ? -80 : w + 80,
        y: rand(h * 0.1, h * 0.7),
        vx: (fromLeft ? 1 : -1) * rand(90, 180),
        vy: rand(30, 80),
        radius: rand(18, 34),
        color: randChoice([CYAN, MAGENTA, '#ffd700', '#66ff99']),
      });
      this.bossT = rand(2, 4);
    }
    for (const b of this.bosses) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
    this.bosses = this.bosses.filter(b => b.y < h + 100 && b.x > -200 && b.x < w + 200);
  }
  draw(ctx, w, h) {
    // étoiles de fond
    for (const s of this.bgStars) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    // comètes normales
    for (const c of this.comets) {
      for (const sp of c.sparkle) {
        ctx.fillStyle = `rgba(255,255,255,${sp.life * 0.7})`;
        ctx.fillRect(sp.x, sp.y, 1.5, 1.5);
      }
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
    // boss comets
    for (const b of this.bosses) {
      const tx = b.x - b.vx * 0.4;
      const ty = b.y - b.vy * 0.4;
      const grad = ctx.createLinearGradient(b.x, b.y, tx, ty);
      grad.addColorStop(0, b.color);
      grad.addColorStop(0.5, `${b.color}80`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = b.radius * 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.shadowBlur = 25;
      ctx.shadowColor = b.color;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

// === 3. Ghost tetrominos ===
// Couches : tetrominos translucides qui tombent + empilement bas + flash de ligne
// Événement : "line flash" horizontal (bande lumineuse balaye l'écran) ~ toutes les 3s.
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
  constructor() { this.pieces = []; this.flash = null; this.flashT = 0; }
  init(w, h) {
    this.pieces = [];
    for (let i = 0; i < 45; i++) this._spawn(w, h, true);
    this.flashT = rand(0.5, 1.5);
    this.flash = null;
  }
  _spawn(w, h, initial) {
    this.pieces.push({
      shape: randChoice(TETRO_SHAPES),
      x: Math.random() * w,
      y: initial ? Math.random() * h : -80,
      vy: rand(18, 55),
      rot: Math.random() * Math.PI * 2,
      vRot: rand(-0.6, 0.6),
      size: rand(18, 40),
      color: randChoice(TETRO_COLORS),
    });
  }
  update(dt, w, h) {
    for (const p of this.pieces) {
      p.y += p.vy * dt;
      p.rot += p.vRot * dt;
    }
    this.pieces = this.pieces.filter(p => p.y < h + 100);
    while (this.pieces.length < 45) this._spawn(w, h, false);
    // flash horizontal (multiple en simultané possible)
    this.flashT -= dt;
    if (this.flashT <= 0) {
      if (!this.flashes) this.flashes = [];
      this.flashes.push({ y: rand(h * 0.1, h * 0.9), life: 0.7, color: randChoice([CYAN, MAGENTA, '#ffff66', '#66ff99']) });
      this.flashT = rand(0.6, 1.6);
    }
    if (this.flashes) {
      for (const f of this.flashes) f.life -= dt;
      this.flashes = this.flashes.filter(f => f.life > 0);
    }
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
    if (this.flashes) {
      for (const f of this.flashes) {
        const a = Math.max(0, f.life / 0.7);
        const bandH = 30 + (1 - a) * 60;
        const grad = ctx.createLinearGradient(0, f.y - bandH / 2, 0, f.y + bandH / 2);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.5, `${f.color}${Math.floor(a * 180).toString(16).padStart(2, '0')}`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, f.y - bandH / 2, w, bandH);
      }
    }
  }
}

// === 4. Vaporwave ===
// Couches : ciel dégradé → soleil rayé → grille perspective → palmiers silhouettes → dauphin event
// Événement : dauphin qui saute par-dessus le soleil en arc de cercle toutes les ~5-7s.
class VaporwaveGrid {
  constructor() { this.offset = 0; this.dolphins = []; this.dolphinT = 1; this.palms = []; this.birds = []; this.birdT = 1; }
  init(w, h) {
    this.offset = 0;
    this.dolphinT = rand(0.5, 1.5);
    this.dolphins = [];
    this.birds = [];
    this.birdT = rand(0.5, 1.5);
    this.palms = [];
    for (let i = 0; i < 10; i++) {
      this.palms.push({
        x: rand(0, w),
        scale: rand(0.5, 1.2),
        sway: Math.random() * Math.PI * 2,
      });
    }
  }
  update(dt, w, h) {
    this.offset = (this.offset + dt * 60) % 80;
    for (const p of this.palms) p.sway += dt * 1.5;
    this.dolphinT -= dt;
    if (this.dolphinT <= 0 && this.dolphins.length < 3) {
      const fromLeft = Math.random() < 0.5;
      this.dolphins.push({ t: 0, duration: rand(1.8, 2.8), fromLeft, yOffset: rand(-40, 40) });
      this.dolphinT = rand(1.2, 2.5);
    }
    for (const d of this.dolphins) d.t += dt;
    this.dolphins = this.dolphins.filter(d => d.t < d.duration);
    // oiseaux (triangles en V qui traversent le ciel)
    this.birdT -= dt;
    if (this.birdT <= 0) {
      const fromLeft = Math.random() < 0.5;
      const count = 3 + Math.floor(Math.random() * 4);
      const baseY = rand(h * 0.12, h * 0.38);
      for (let i = 0; i < count; i++) {
        this.birds.push({
          x: fromLeft ? -30 - i * 20 : w + 30 + i * 20,
          y: baseY + i * 6,
          vx: (fromLeft ? 1 : -1) * rand(60, 110),
          flap: Math.random() * Math.PI * 2,
        });
      }
      this.birdT = rand(1.5, 3.5);
    }
    for (const b of this.birds) {
      b.x += b.vx * dt;
      b.flap += dt * 6;
    }
    this.birds = this.birds.filter(b => b.x > -50 && b.x < w + 50);
  }
  draw(ctx, w, h) {
    const horizonY = h * 0.55;
    const sunR = Math.min(w, h) * 0.18;
    const sunX = w / 2;
    const sunY = horizonY - sunR * 0.3;
    // ciel dégradé
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#1a0a3a');
    skyGrad.addColorStop(1, '#ff66aa');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizonY);
    // soleil
    const sunGrad = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY + sunR);
    sunGrad.addColorStop(0, '#ff66aa');
    sunGrad.addColorStop(0.5, '#ff8844');
    sunGrad.addColorStop(1, '#ffcc33');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();
    // bandes sur le soleil
    ctx.fillStyle = 'rgba(8,8,26,0.9)';
    for (let i = 0; i < 5; i++) {
      const y = sunY - sunR * 0.1 + i * sunR * 0.22;
      if (y < sunY + sunR * 0.95) {
        const half = Math.sqrt(Math.max(0, sunR * sunR - (y - sunY) * (y - sunY)));
        ctx.fillRect(sunX - half, y, half * 2, 2);
      }
    }
    // dauphins qui sautent
    for (const d of this.dolphins) {
      const t = d.t / d.duration;
      const arcX = d.fromLeft
        ? sunX - sunR * 2 + t * sunR * 4
        : sunX + sunR * 2 - t * sunR * 4;
      const arcY = sunY + d.yOffset - Math.sin(t * Math.PI) * sunR * 1.4;
      const flip = d.fromLeft ? 1 : -1;
      ctx.save();
      ctx.translate(arcX, arcY);
      ctx.scale(flip, 1);
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.moveTo(-16, 2);
      ctx.quadraticCurveTo(-8, -8, 8, -6);
      ctx.quadraticCurveTo(18, -4, 14, 4);
      ctx.quadraticCurveTo(6, 6, -6, 5);
      ctx.lineTo(-14, 10);
      ctx.lineTo(-18, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // oiseaux en V
    ctx.fillStyle = '#000';
    for (const b of this.birds) {
      const flapY = Math.sin(b.flap) * 3;
      ctx.beginPath();
      ctx.moveTo(b.x - 8, b.y - flapY);
      ctx.lineTo(b.x, b.y + 2);
      ctx.lineTo(b.x + 8, b.y - flapY);
      ctx.lineTo(b.x, b.y);
      ctx.closePath();
      ctx.fill();
    }
    // grille perspective
    ctx.strokeStyle = 'rgba(255,45,149,0.8)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#ff2d95';
    for (let i = 0; i < 16; i++) {
      const t = (i * 80 + this.offset) / (16 * 80);
      const y = horizonY + Math.pow(t, 2) * (h - horizonY);
      if (y > h) continue;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let i = -10; i <= 10; i++) {
      const x = w / 2 + i * w / 20;
      ctx.beginPath();
      ctx.moveTo(x, horizonY);
      ctx.lineTo(w / 2 + i * w, h);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    // palmiers silhouettes
    ctx.fillStyle = '#000';
    for (const palm of this.palms) {
      const px = palm.x;
      const py = horizonY;
      const trunkH = 70 * palm.scale;
      const trunkW = 4 * palm.scale;
      ctx.fillRect(px - trunkW / 2, py - trunkH, trunkW, trunkH);
      // feuilles
      for (let a = -1; a <= 1; a++) {
        for (let b = 0; b < 4; b++) {
          const angle = (b / 4) * Math.PI + a * 0.3 - Math.PI / 2;
          const lx = px + Math.cos(angle) * 22 * palm.scale;
          const ly = py - trunkH + Math.sin(angle) * 14 * palm.scale;
          ctx.beginPath();
          ctx.moveTo(px, py - trunkH);
          ctx.quadraticCurveTo(
            (px + lx) / 2 + a * 3,
            py - trunkH - 8 * palm.scale,
            lx, ly,
          );
          ctx.lineTo(lx - 2, ly + 2);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  }
}

// === 5. Matrix rain ===
// Couches : pluie de katakana verts → caractères en alerte (rouge/orange) → sweep glitch horizontal
// Événement : bande horizontale qui balaye l'écran + paquet de caractères rouges random.
const MATRIX_CHARS = 'アァカサタナハマヤラワガザダバパイィキシチニヒミリヰギジヂビピウヴクスツヌフムユルグズヅブプ0123456789ABCDEF'.split('');
class MatrixRain {
  constructor() { this.cols = []; this.alerts = []; this.alertT = 0; this.sweep = null; this.sweepT = 0; }
  init(w, h) {
    const colW = 12;
    const count = Math.floor(w / colW);
    this.cols = [];
    for (let i = 0; i < count; i++) {
      this.cols.push({
        x: i * colW,
        y: Math.random() * h,
        speed: rand(180, 460),
        chars: Array.from({ length: 20 }, () => randChoice(MATRIX_CHARS)),
        swapT: rand(0.05, 0.25),
      });
    }
    this.alerts = [];
    this.alertT = rand(0.2, 0.8);
    this.sweepT = rand(0.8, 2);
    this.sweeps = [];
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
    // alertes rouges (plusieurs par burst)
    this.alertT -= dt;
    if (this.alertT <= 0) {
      for (let k = 0; k < 3; k++) {
        const col = this.cols[Math.floor(Math.random() * this.cols.length)];
        if (col) this.alerts.push({ col, charIdx: Math.floor(Math.random() * col.chars.length), life: 1.2 });
      }
      this.alertT = rand(0.4, 1.2);
    }
    for (const a of this.alerts) a.life -= dt;
    this.alerts = this.alerts.filter(a => a.life > 0);
    // sweeps glitch (plusieurs simultanés possibles)
    this.sweepT -= dt;
    if (this.sweepT <= 0) {
      this.sweeps.push({ y: -30, vy: rand(600, 1100), color: Math.random() < 0.3 ? '#ff5028' : '#d8ffd8' });
      this.sweepT = rand(0.7, 2);
    }
    for (const s of this.sweeps) s.y += s.vy * dt;
    this.sweeps = this.sweeps.filter(s => s.y < h + 60);
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
    // caractères en alerte
    for (const a of this.alerts) {
      const y = a.col.y - a.charIdx * 16;
      if (y < -16 || y > h + 16) continue;
      const alpha = Math.min(1, a.life);
      ctx.fillStyle = `rgba(255,80,40,${alpha})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ff5028';
      ctx.fillText(a.col.chars[a.charIdx], a.col.x, y);
      ctx.shadowBlur = 0;
    }
    // sweeps glitch
    for (const s of this.sweeps) {
      const sy = s.y;
      const rgb = hexToRgb(s.color);
      const grad = ctx.createLinearGradient(0, sy - 40, 0, sy + 40);
      grad.addColorStop(0, `rgba(${rgb},0)`);
      grad.addColorStop(0.5, `rgba(${rgb},0.4)`);
      grad.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, sy - 40, w, 80);
    }
  }
}

// === 6. Rockets ===
// Couches : étoiles de fond → satellite qui traverse → fusées qui montent → explosion au sommet
// Événement : satellite horizontal (lumière clignotante) + explosion sur chaque fusée au sommet.
class Rockets {
  constructor() { this.rockets = []; this.bursts = []; this.bgStars = []; this.satellites = []; this.satT = 1; this.spawnT = 0.3; }
  init(w, h) {
    this.rockets = [];
    this.bursts = [];
    this.spawnT = 0.1;
    this.satT = rand(0.3, 1);
    this.satellites = [];
    this.bgStars = [];
    for (let i = 0; i < 120; i++) {
      this.bgStars.push({ x: Math.random() * w, y: Math.random() * h * 0.7, size: Math.random() * 1.4 });
    }
  }
  update(dt, w, h) {
    // satellites (plusieurs en parallèle)
    this.satT -= dt;
    if (this.satT <= 0 && this.satellites.length < 4) {
      const fromLeft = Math.random() < 0.5;
      this.satellites.push({
        x: fromLeft ? -30 : w + 30,
        y: rand(h * 0.05, h * 0.45),
        vx: (fromLeft ? 1 : -1) * rand(30, 80),
        blink: 0,
      });
      this.satT = rand(1.5, 4);
    }
    for (const s of this.satellites) {
      s.x += s.vx * dt;
      s.blink = (s.blink + dt) % 1.2;
    }
    this.satellites = this.satellites.filter(s => s.x > -60 && s.x < w + 60);
    // fusées
    this.spawnT -= dt;
    while (this.spawnT <= 0) {
      this.rockets.push({
        x: Math.random() * w,
        y: h + 20,
        vx: rand(-50, 50),
        vy: -rand(220, 380),
        particles: [],
        color: randChoice([CYAN, MAGENTA, '#ff8800', '#ffff66', '#66ff99', '#ff3333', '#b967ff']),
        exploded: false,
      });
      this.spawnT += rand(0.1, 0.4);
    }
    for (const r of this.rockets) {
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      if (Math.random() < 0.9) r.particles.push({ x: r.x + rand(-2, 2), y: r.y + 6, life: 1 });
      for (const p of r.particles) { p.life -= dt * 2.2; p.y += 22 * dt; }
      r.particles = r.particles.filter(p => p.life > 0);
      // explosion au sommet
      if (!r.exploded && r.y < h * 0.25) {
        r.exploded = true;
        const count = Math.floor(rand(18, 30));
        const parts = [];
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          const v = rand(60, 130);
          parts.push({
            x: r.x, y: r.y,
            vx: Math.cos(a) * v, vy: Math.sin(a) * v,
            life: 1, color: r.color,
          });
        }
        this.bursts.push({ parts });
      }
    }
    this.rockets = this.rockets.filter(r => r.y > -40 && !r.exploded);
    // bursts
    for (const b of this.bursts) {
      for (const p of b.parts) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vy += 55 * dt;
        p.life -= dt * 0.8;
      }
      b.parts = b.parts.filter(p => p.life > 0);
    }
    this.bursts = this.bursts.filter(b => b.parts.length > 0);
  }
  draw(ctx, w, h) {
    // étoiles fond
    for (const s of this.bgStars) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    // satellites
    for (const s of this.satellites) {
      ctx.fillStyle = '#aaa';
      ctx.fillRect(s.x - 6, s.y - 2, 12, 4);
      ctx.fillRect(s.x - 10, s.y - 1, 3, 2);
      ctx.fillRect(s.x + 7, s.y - 1, 3, 2);
      ctx.fillStyle = '#4488bb';
      ctx.fillRect(s.x - 14, s.y - 3, 3, 6);
      ctx.fillRect(s.x + 11, s.y - 3, 3, 6);
      if (s.blink < 0.6) {
        ctx.fillStyle = '#ff3030';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#ff3030';
        ctx.fillRect(s.x - 1, s.y - 1, 2, 2);
        ctx.shadowBlur = 0;
      }
    }
    // bursts
    for (const b of this.bursts) {
      for (const p of b.parts) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      }
    }
    ctx.globalAlpha = 1;
    // fusées
    for (const r of this.rockets) {
      for (const p of r.particles) {
        ctx.fillStyle = `rgba(255,170,40,${p.life * 0.8})`;
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
// Couches : traînées de lancement → bursts classiques → mega-burst avec onde de choc
// Événement : mega-burst toutes les 3-5s (cercle + anneau expansif).
const FIREWORK_COLORS = ['#ff2d95', '#00eaff', '#ffff66', '#66ff99', '#ff8800', '#ffffff', '#b967ff'];
class Fireworks {
  constructor() { this.bursts = []; this.trails = []; this.rings = []; this.spawnT = 0.3; this.megaT = 3; }
  init() {
    this.bursts = [];
    this.trails = [];
    this.rings = [];
    this.spawnT = 0.1;
    this.megaT = rand(0.8, 2);
  }
  update(dt, w, h) {
    // traînées de lancement (plusieurs par seconde)
    this.spawnT -= dt;
    while (this.spawnT <= 0) {
      const cx = rand(w * 0.08, w * 0.92);
      const cy = rand(h * 0.12, h * 0.6);
      const color = randChoice(FIREWORK_COLORS);
      this.trails.push({
        x: cx,
        y: h + 10,
        targetY: cy,
        vy: -rand(280, 420),
        color,
        life: 1,
      });
      this.spawnT += rand(0.15, 0.45);
    }
    for (const t of this.trails) {
      t.y += t.vy * dt;
      if (t.y <= t.targetY) {
        t.life = 0;
        this._explode(t.x, t.targetY, t.color);
      }
    }
    this.trails = this.trails.filter(t => t.life > 0);
    // mega-burst
    this.megaT -= dt;
    if (this.megaT <= 0) {
      const cx = rand(w * 0.15, w * 0.85);
      const cy = rand(h * 0.15, h * 0.55);
      const color = randChoice(FIREWORK_COLORS);
      this._explode(cx, cy, color, 110, 340, 2.2);
      this.rings.push({ x: cx, y: cy, r: 10, maxR: rand(200, 320), color, life: 1 });
      this.megaT = rand(1.2, 2.5);
    }
    // bursts update
    for (const b of this.bursts) {
      for (const p of b.parts) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vy += 70 * dt;
        p.vx *= 0.98; p.vy *= 0.98;
        p.life -= dt * 0.75;
      }
      b.parts = b.parts.filter(p => p.life > 0);
    }
    this.bursts = this.bursts.filter(b => b.parts.length > 0);
    // rings update
    for (const r of this.rings) {
      r.r += (r.maxR - r.r) * dt * 2;
      r.life -= dt * 0.8;
    }
    this.rings = this.rings.filter(r => r.life > 0);
  }
  _explode(cx, cy, color, count = null, maxV = null, lifeMul = 1) {
    count = count || Math.floor(rand(30, 55));
    maxV = maxV || 240;
    const parts = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rand(-0.15, 0.15);
      const v = rand(80, maxV);
      parts.push({
        x: cx, y: cy,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: lifeMul, color,
      });
    }
    this.bursts.push({ parts });
  }
  draw(ctx) {
    // traînées
    for (const t of this.trails) {
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 6;
      ctx.shadowColor = t.color;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.lineTo(t.x, t.y - 14);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    // rings mega-burst
    for (const r of this.rings) {
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2.5 * r.life;
      ctx.globalAlpha = r.life * 0.8;
      ctx.shadowBlur = 14;
      ctx.shadowColor = r.color;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    // bursts
    for (const b of this.bursts) {
      for (const p of b.parts) {
        const rgb = hexToRgb(p.color);
        ctx.fillStyle = `rgba(${rgb},${Math.max(0, p.life)})`;
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      }
    }
  }
}

const _hexCache = new Map();
function hexToRgb(hex) {
  if (_hexCache.has(hex)) return _hexCache.get(hex);
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const out = `${r},${g},${b}`;
  _hexCache.set(hex, out);
  return out;
}

// === 8. Plasma waves ===
// Couches : ondes sinusoïdales → particules brillantes chevauchant les crêtes → beat drop
// Événement : "beat drop" toutes les ~3s — amplitude des ondes triple + flash clair.
class PlasmaWaves {
  constructor() { this.t = 0; this.riders = []; this.beatT = 0; this.beat = 0; }
  init(w, h) {
    this.t = 0;
    this.beatT = rand(0.8, 1.8);
    this.beat = 0;
    this.riders = [];
    for (let i = 0; i < 60; i++) {
      this.riders.push({
        x: Math.random() * w,
        phase: Math.random() * Math.PI * 2,
        speed: rand(40, 120),
        wave: Math.floor(Math.random() * 3),
        color: randChoice([CYAN, MAGENTA, '#b967ff', '#ffd700', '#66ff99']),
      });
    }
  }
  update(dt, w, h) {
    this.t += dt;
    this.beatT -= dt;
    if (this.beatT <= 0) { this.beat = 1; this.beatT = rand(1.2, 2); }
    this.beat = Math.max(0, this.beat - dt * 1.2);
    for (const r of this.riders) {
      r.x += r.speed * dt;
      if (r.x > w + 10) r.x = -10;
    }
  }
  draw(ctx, w, h) {
    const ampBoost = 1 + this.beat * 2;
    const waves = [
      { amp: 40 * ampBoost, freq: 0.008, phase: 0,            speed: 1.2, color: CYAN,      offY: h * 0.5 },
      { amp: 55 * ampBoost, freq: 0.006, phase: Math.PI,      speed: 0.8, color: MAGENTA,   offY: h * 0.55 },
      { amp: 32 * ampBoost, freq: 0.012, phase: Math.PI / 2,  speed: 1.6, color: '#b967ff', offY: h * 0.45 },
    ];
    ctx.lineWidth = 2.5 + this.beat * 1.5;
    ctx.shadowBlur = 14 + this.beat * 14;
    for (const wv of waves) {
      const rgb = hexToRgb(wv.color);
      ctx.strokeStyle = `rgba(${rgb},${0.55 + this.beat * 0.35})`;
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
    // particules qui chevauchent les ondes
    for (const r of this.riders) {
      const wv = waves[r.wave];
      const y = wv.offY
        + Math.sin(r.x * wv.freq + wv.phase + this.t * wv.speed) * wv.amp
        + Math.sin(r.x * wv.freq * 2.7 + this.t * wv.speed * 0.6) * wv.amp * 0.4;
      const rgb = hexToRgb(r.color);
      ctx.fillStyle = `rgba(${rgb},0.9)`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = r.color;
      ctx.fillRect(r.x - 2, y - 2, 4, 4);
    }
    ctx.shadowBlur = 0;
    // beat flash
    if (this.beat > 0.5) {
      ctx.fillStyle = `rgba(255,255,255,${(this.beat - 0.5) * 0.2})`;
      ctx.fillRect(0, 0, w, h);
    }
  }
}

// === 9. Asteroids ===
// Couches : planète lointaine (fond) → champ d'astéroïdes → astéroïdes qui explosent
// Événement : un astéroïde explose en 3-4 fragments toutes les ~4s.
class Asteroids {
  constructor() { this.rocks = []; this.fragments = []; this.planets = []; this.explodeT = 0; this.bgStars = []; }
  init(w, h) {
    this.rocks = [];
    this.fragments = [];
    this.explodeT = rand(0.6, 1.5);
    this.planets = [];
    for (let i = 0; i < 3; i++) {
      this.planets.push({
        x: rand(w * 0.1, w * 0.9),
        y: rand(h * 0.1, h * 0.5),
        r: rand(40, 110),
        color: randChoice(['#ff6b35', '#6633cc', '#33aa88', '#996633', '#cc3366', '#33ccaa']),
      });
    }
    this.bgStars = [];
    for (let i = 0; i < 100; i++) {
      this.bgStars.push({ x: Math.random() * w, y: Math.random() * h, size: Math.random() * 1.2 });
    }
    for (let i = 0; i < 28; i++) this._spawn(w, h, true);
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
      baseR,
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
    while (this.rocks.length < 28) this._spawn(w, h, false);
    // fragments
    for (const f of this.fragments) {
      f.x += f.vx * dt; f.y += f.vy * dt;
      f.rot += f.vRot * dt;
      f.life -= dt;
    }
    this.fragments = this.fragments.filter(f => f.life > 0);
    // événement explosion (souvent)
    this.explodeT -= dt;
    if (this.explodeT <= 0 && this.rocks.length > 0) {
      const victim = this.rocks[Math.floor(Math.random() * this.rocks.length)];
      const n = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rand(-0.4, 0.4);
        const v = rand(40, 90);
        const fragVerts = 5 + Math.floor(Math.random() * 3);
        const fragShape = [];
        const fragR = victim.baseR * 0.45;
        for (let j = 0; j < fragVerts; j++) {
          const aa = (j / fragVerts) * Math.PI * 2;
          fragShape.push({ x: Math.cos(aa) * fragR * rand(0.7, 1.1), y: Math.sin(aa) * fragR * rand(0.7, 1.1) });
        }
        this.fragments.push({
          x: victim.x, y: victim.y,
          vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          rot: victim.rot, vRot: rand(-2, 2),
          shape: fragShape,
          color: victim.color,
          life: 1.8,
        });
      }
      this.rocks = this.rocks.filter(r => r !== victim);
      this.explodeT = rand(0.8, 2);
    }
  }
  draw(ctx, w, h) {
    // étoiles fond
    for (const s of this.bgStars) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    // planètes
    for (const p of this.planets) {
      const rgb = hexToRgb(p.color);
      const grad = ctx.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.2, p.x, p.y, p.r);
      grad.addColorStop(0, `rgba(${rgb},0.55)`);
      grad.addColorStop(0.7, `rgba(${rgb},0.15)`);
      grad.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${rgb},0.35)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // astéroïdes
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
    // fragments
    for (const f of this.fragments) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      const rgb = hexToRgb(f.color);
      const alpha = Math.min(1, f.life);
      ctx.strokeStyle = `rgba(${rgb},${alpha * 0.9})`;
      ctx.shadowColor = f.color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < f.shape.length; i++) {
        const p = f.shape[i];
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
// Couches : lignes radiantes → anneaux concentriques → streaks qui filent le long des rayons
// Événement : "warp speed" toutes les ~3.5s — les rayons s'allongent et les streaks accélèrent.
class Wormhole {
  constructor() { this.rings = []; this.t = 0; this.streaks = []; this.warp = 0; this.warpT = 0; }
  init(w, h) {
    this.rings = [];
    this.t = 0;
    this.warp = 0;
    this.warpT = rand(0.8, 2);
    for (let i = 0; i < 50; i++) this.rings.push({ age: (i / 50) * 4 });
    this.streaks = [];
    for (let i = 0; i < 140; i++) {
      this.streaks.push({
        angle: Math.random() * Math.PI * 2,
        dist: Math.random() * 500,
        speed: rand(80, 280),
        color: randChoice([CYAN, MAGENTA, '#b967ff', '#ffffff', '#ffd700', '#66ff99']),
      });
    }
  }
  update(dt, w, h) {
    this.t += dt;
    // rings
    const speedMul = 1 + this.warp * 2;
    for (const r of this.rings) r.age += dt * 0.8 * speedMul;
    for (const r of this.rings) { if (r.age >= 4) r.age = 0; }
    // streaks
    for (const s of this.streaks) {
      s.dist += s.speed * dt * speedMul;
      const maxD = Math.hypot(w, h) / 2;
      if (s.dist > maxD) {
        s.dist = 10;
        s.angle = Math.random() * Math.PI * 2;
      }
    }
    // warp
    this.warpT -= dt;
    if (this.warpT <= 0) { this.warp = 1; this.warpT = rand(1.2, 2.5); }
    this.warp = Math.max(0, this.warp - dt * 0.8);
  }
  draw(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.hypot(w, h) / 2;
    // lignes radiantes
    ctx.strokeStyle = `rgba(185,103,255,${0.22 + this.warp * 0.3})`;
    ctx.lineWidth = 1 + this.warp;
    const lines = 24;
    for (let i = 0; i < lines; i++) {
      const a = (i / lines) * Math.PI * 2 + this.t * 0.15;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
      ctx.stroke();
    }
    // anneaux
    ctx.lineWidth = 2;
    for (const r of this.rings) {
      const t = r.age / 4;
      const radius = t * maxR;
      const alpha = Math.sin(t * Math.PI) * (0.55 + this.warp * 0.3);
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
    // streaks
    for (const s of this.streaks) {
      const x = cx + Math.cos(s.angle) * s.dist;
      const y = cy + Math.sin(s.angle) * s.dist;
      const len = 8 + this.warp * 40;
      const tx = cx + Math.cos(s.angle) * (s.dist - len);
      const ty = cy + Math.sin(s.angle) * (s.dist - len);
      const rgb = hexToRgb(s.color);
      const grad = ctx.createLinearGradient(x, y, tx, ty);
      grad.addColorStop(0, `rgba(${rgb},0.9)`);
      grad.addColorStop(1, `rgba(${rgb},0)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5 + this.warp * 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
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
    this.pulses = [];
    this._lastForceCycle = 0;
  }

  // Déclenche un flash plein écran (onde expansive + éclair de couleur).
  // Utilisé par ex. quand une IA monte de niveau en versus.
  pulse(color = '#ffffff', intensity = 1) {
    this.pulses.push({
      color,
      age: 0,
      duration: 1.2,
      intensity: Math.max(0.2, Math.min(2, intensity)),
    });
  }

  // Force le passage à la scène suivante mais debounce pour éviter qu'un
  // double level-up quasi simultané ne zappe une scène sans la voir.
  forceNextIfReady() {
    const now = performance.now();
    if (now - this._lastForceCycle < 1500) return false;
    this._lastForceCycle = now;
    this.next();
    return true;
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

    for (const p of this.pulses) p.age += step;
    this.pulses = this.pulses.filter(p => p.age < p.duration);

    this._draw();
  }

  _draw() {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    ctx.clearRect(0, 0, w, h);

    if (this.fadeFrom >= 0) {
      const fadeTotal = FADE_MS / 1000;
      const t = 1 - this.fadeTimer / fadeTotal;
      if (t < 0.5) {
        this.animations[this.fadeFrom].draw(ctx, w, h);
        ctx.fillStyle = `rgba(0,0,0,${t * 2})`;
        ctx.fillRect(0, 0, w, h);
      } else {
        this.animations[this.currentIndex].draw(ctx, w, h);
        ctx.fillStyle = `rgba(0,0,0,${(1 - t) * 2})`;
        ctx.fillRect(0, 0, w, h);
      }
    } else {
      this.animations[this.currentIndex].draw(ctx, w, h);
    }

    // Pulses plein écran (level-up, événements forts) rendus par-dessus le fade.
    if (this.pulses.length > 0) this._drawPulses(ctx, w, h);
  }

  _drawPulses(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.hypot(w, h);
    for (const p of this.pulses) {
      const t = p.age / p.duration;
      const radius = t * maxR * 0.8;
      const ringAlpha = (1 - t) * 0.55 * p.intensity;
      // anneau principal qui s'étend
      const rgb = hexToRgb(p.color);
      ctx.strokeStyle = `rgba(${rgb},${ringAlpha})`;
      ctx.lineWidth = 6 + p.intensity * 14 * (1 - t * 0.5);
      ctx.shadowBlur = 30 * p.intensity;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      // anneau secondaire décalé
      ctx.lineWidth = 3;
      ctx.strokeStyle = `rgba(${rgb},${ringAlpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      // flash de couleur au début (0 → 0.25)
      if (t < 0.25) {
        const flashA = (0.25 - t) / 0.25 * 0.35 * p.intensity;
        ctx.fillStyle = `rgba(${rgb},${flashA})`;
        ctx.fillRect(0, 0, w, h);
      }
    }
  }
}
