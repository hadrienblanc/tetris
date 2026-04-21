// Jauge arcade VS : compare deux scores (gauche vs droite) sur un canvas central.
// Rendu : gros "VS" en haut, jauge verticale bi-couleur, chevrons animés côté leader,
// scores digitaux avec glow, scanlines arcade.

const P1_COLOR = '#00eaff';
const P1_GLOW  = '#00eaff';
const P2_COLOR = '#ff2d95';
const P2_GLOW  = '#ff2d95';
const BG_COLOR = '#08081a';
const FRAME_COLOR = '#1a1a3a';

export class ScoreGauge {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.displayRatio = 0.5;   // animation lissée
    this.displayP1 = 0;
    this.displayP2 = 0;
    this._startTime = performance.now();
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  reset() {
    this.displayRatio = 0.5;
    this.displayP1 = 0;
    this.displayP2 = 0;
  }

  // state : { p1Score, p2Score, p1Lines, p2Lines, p1Level, p2Level,
  //           p1LeadTime, p2LeadTime, p1Name, p2Name, p1Over, p2Over, winner }
  draw(state, timestamp) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const t = timestamp || performance.now();
    const elapsed = t - this._startTime;

    const p1 = Math.max(0, state.p1Score || 0);
    const p2 = Math.max(0, state.p2Score || 0);
    const total = p1 + p2;
    const targetRatio = total > 0 ? p1 / total : 0.5;

    // Lissage exponentiel (réactif mais pas saccadé)
    this.displayRatio += (targetRatio - this.displayRatio) * 0.08;
    this.displayP1 += (p1 - this.displayP1) * 0.25;
    this.displayP2 += (p2 - this.displayP2) * 0.25;

    // Fond
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    // Cadre arcade
    ctx.strokeStyle = FRAME_COLOR;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    // Scanlines discrètes
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#000';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    ctx.globalAlpha = 1;

    // Zones verticales — laissent assez d'espace pour que les boxes LEAD TIME
    // (38px + tirets de coin) ne touchent pas les chevrons des blocs joueur
    // (qui s'étendent jusqu'à y=138 côté haut et y=h-118 côté bas).
    const titleY = 28;
    const p1InfoY = 74;
    const p2InfoY = h - 58;
    const barTop = 186;
    const barBottom = h - 166;
    const barX = w / 2 - 22;
    const barW = 44;
    const barH = barBottom - barTop;
    const leadBoxY1 = 162;         // entre le bloc AI 1 et la jauge
    const leadBoxY2 = h - 142;     // entre la jauge et le bloc AI 2

    // Titre "VS"
    this._drawVSTitle(ctx, w / 2, titleY, elapsed);

    // Bloc AI 1 (haut)
    this._drawPlayerBlock(ctx, {
      x: w / 2,
      y: p1InfoY,
      label: state.p1Name || 'AI 1',
      color: P1_COLOR,
      glow: P1_GLOW,
      score: Math.round(this.displayP1),
      lines: state.p1Lines | 0,
      level: state.p1Level | 0,
      over: !!state.p1Over,
      leading: targetRatio > 0.5,
      leadStrength: Math.abs(targetRatio - 0.5) * 2,
      elapsed,
      chevronDir: 'up',
    });

    // Bloc AI 2 (bas)
    this._drawPlayerBlock(ctx, {
      x: w / 2,
      y: p2InfoY,
      label: state.p2Name || 'AI 2',
      color: P2_COLOR,
      glow: P2_GLOW,
      score: Math.round(this.displayP2),
      lines: state.p2Lines | 0,
      level: state.p2Level | 0,
      over: !!state.p2Over,
      leading: targetRatio < 0.5,
      leadStrength: Math.abs(targetRatio - 0.5) * 2,
      elapsed,
      chevronDir: 'down',
    });

    // Chronos "LEAD TIME" — c'est le critère de victoire officiel en versus.
    const ltL = Math.max(0, state.p1LeadTime || 0);
    const ltR = Math.max(0, state.p2LeadTime || 0);
    const winningSide = ltL > ltR ? 'p1' : ltR > ltL ? 'p2' : null;
    // Intensité 0→1 : proportionnelle à l'écart cumulé, saturée à 30s d'avance.
    // Sert à faire grossir le halo du meneur pour rendre la domination visible.
    const leadIntensity = Math.min(1, Math.abs(ltL - ltR) / 30000);
    this._drawLeadTime(ctx, {
      x: w / 2,
      y: leadBoxY1,
      color: P1_COLOR,
      glow: P1_GLOW,
      timeMs: ltL,
      isWinning: winningSide === 'p1',
      intensity: leadIntensity,
      over: !!state.p1Over,
      elapsed,
    });
    this._drawLeadTime(ctx, {
      x: w / 2,
      y: leadBoxY2,
      color: P2_COLOR,
      glow: P2_GLOW,
      timeMs: ltR,
      isWinning: winningSide === 'p2',
      intensity: leadIntensity,
      over: !!state.p2Over,
      elapsed,
    });

    // Jauge verticale
    this._drawGauge(ctx, barX, barTop, barW, barH, this.displayRatio, elapsed);

    // Diff en pts, au milieu du cadran
    const diff = Math.round(this.displayP1 - this.displayP2);
    this._drawDiff(ctx, w / 2, (barTop + barBottom) / 2, diff, elapsed);

    // Annonce vainqueur
    if (state.winner) {
      this._drawWinnerBanner(ctx, w, h, state.winner, elapsed);
    }
  }

  _drawVSTitle(ctx, cx, cy, elapsed) {
    const pulse = 0.85 + Math.sin(elapsed * 0.004) * 0.15;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 36px monospace';
    ctx.shadowBlur = 16 * pulse;
    ctx.shadowColor = '#fff';
    ctx.fillStyle = '#fff';
    ctx.fillText('VS', cx, cy);
    ctx.shadowBlur = 0;
    // Outline bi-couleur
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = P1_COLOR;
    ctx.lineWidth = 1;
    ctx.strokeText('VS', cx - 1, cy);
    ctx.strokeStyle = P2_COLOR;
    ctx.strokeText('VS', cx + 1, cy);
    ctx.restore();
  }

  _drawPlayerBlock(ctx, cfg) {
    const { x, y, label, color, glow, score, lines, level, over, leading, leadStrength, elapsed, chevronDir } = cfg;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Label (AI 1 / AI 2)
    ctx.font = 'bold 14px monospace';
    ctx.globalAlpha = over ? 0.4 : 1;
    ctx.fillStyle = color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = glow;
    ctx.fillText(label, x, y - 16);

    // Score digital
    ctx.font = 'bold 22px monospace';
    ctx.shadowBlur = 12;
    const scoreTxt = String(score).padStart(6, '0');
    ctx.fillText(scoreTxt, x, y + 8);

    // Lignes + niveau sur la même ligne pour garder la mise en page compacte
    ctx.font = '10px monospace';
    ctx.shadowBlur = 0;
    ctx.globalAlpha = (over ? 0.3 : 0.75);
    const linesTxt = `${lines} LIG`;
    const lvlTxt = level > 0 ? `LVL ${level}` : '';
    // bloc lignes (gris)
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'right';
    ctx.fillText(linesTxt, x - 4, y + 26);
    // bloc niveau (couleur joueur)
    if (lvlTxt) {
      ctx.fillStyle = color;
      ctx.globalAlpha = (over ? 0.3 : 0.95);
      ctx.textAlign = 'left';
      ctx.fillText(lvlTxt, x + 4, y + 26);
    }
    ctx.textAlign = 'center';

    // Chevrons si leader
    if (leading && !over && leadStrength > 0.02) {
      const nChev = Math.min(3, 1 + Math.floor(leadStrength * 5));
      const phase = (elapsed * 0.006) % 1;
      const chevY0 = chevronDir === 'up' ? y + 40 : y - 36;
      const step = chevronDir === 'up' ? 10 : -10;
      ctx.strokeStyle = color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = glow;
      ctx.lineWidth = 2;
      for (let i = 0; i < nChev; i++) {
        const a = 1 - ((i + phase) / nChev);
        ctx.globalAlpha = Math.max(0.15, a);
        const cy = chevY0 + step * i;
        ctx.beginPath();
        if (chevronDir === 'up') {
          ctx.moveTo(x - 8, cy + 4);
          ctx.lineTo(x, cy - 4);
          ctx.lineTo(x + 8, cy + 4);
        } else {
          ctx.moveTo(x - 8, cy - 4);
          ctx.lineTo(x, cy + 4);
          ctx.lineTo(x + 8, cy - 4);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  _drawGauge(ctx, x, y, w, h, ratio, elapsed) {
    ctx.save();
    // Cadre de la jauge
    ctx.fillStyle = '#03030a';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#2a2a5a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    const divider = y + h * (1 - ratio);

    // Zone P1 (haut)
    const gradP1 = ctx.createLinearGradient(x, y, x, divider);
    gradP1.addColorStop(0, '#003a44');
    gradP1.addColorStop(1, P1_COLOR);
    ctx.fillStyle = gradP1;
    ctx.fillRect(x + 2, y + 2, w - 4, Math.max(0, divider - y - 2));

    // Zone P2 (bas)
    const gradP2 = ctx.createLinearGradient(x, divider, x, y + h);
    gradP2.addColorStop(0, P2_COLOR);
    gradP2.addColorStop(1, '#440026');
    ctx.fillStyle = gradP2;
    ctx.fillRect(x + 2, divider, w - 4, Math.max(0, y + h - divider - 2));

    // Graduations (ticks horizontales)
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    for (let i = 1; i < 10; i++) {
      const ty = y + (h * i) / 10;
      ctx.beginPath();
      ctx.moveTo(x, ty);
      ctx.lineTo(x + (i === 5 ? w : w * 0.4), ty);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Ligne pivot (neon white, pulse)
    const pulse = 0.6 + Math.sin(elapsed * 0.008) * 0.4;
    ctx.globalAlpha = pulse;
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#fff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 6, divider);
    ctx.lineTo(x + w + 6, divider);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Cadre extérieur glow côté leader
    const leadColor = ratio >= 0.5 ? P1_COLOR : P2_COLOR;
    const leadStr = Math.abs(ratio - 0.5) * 2;
    if (leadStr > 0.02) {
      ctx.globalAlpha = 0.4 * leadStr;
      ctx.shadowBlur = 18;
      ctx.shadowColor = leadColor;
      ctx.strokeStyle = leadColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  _drawDiff(ctx, cx, cy, diff, elapsed) {
    if (diff === 0) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 11px monospace';
    const color = diff > 0 ? P1_COLOR : P2_COLOR;
    ctx.fillStyle = color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    const sign = diff > 0 ? '+' : '-';
    const label = `${sign}${Math.abs(diff)}`;
    // Petit offset pour le poser près du divider, sans chevaucher
    ctx.globalAlpha = 0.9;
    ctx.fillText(label, cx, cy);
    ctx.restore();
  }

  _drawLeadTime(ctx, cfg) {
    const { x, y, color, glow, timeMs, isWinning, intensity = 0, over, elapsed } = cfg;
    const boxW = 148;
    const boxH = 38;
    const bx = x - boxW / 2;
    const by = y - boxH / 2;
    // Le meneur reste mis en valeur même après son KO (c'est le critère de
    // victoire) ; seul le *perdant* mort est visuellement éteint.
    const dim = over && !isWinning;
    const pulse = 0.55 + Math.sin(elapsed * 0.012) * 0.45;

    ctx.save();

    // Halo extérieur proportionnel à l'écart : on tire la boîte à 2000px hors
    // canvas et on ramène l'ombre au bon endroit via shadowOffsetX. Résultat :
    // une aura colorée sans bord dur, qui grossit avec la domination.
    if (isWinning && intensity > 0) {
      ctx.save();
      ctx.shadowBlur = (20 + 70 * intensity) * pulse;
      ctx.shadowColor = glow;
      ctx.shadowOffsetX = 2000;
      ctx.globalAlpha = 0.35 + 0.55 * intensity;
      ctx.fillStyle = color;
      ctx.fillRect(bx - 2000, by, boxW, boxH);
      ctx.restore();
    }

    // Fond sombre
    ctx.fillStyle = 'rgba(4,4,14,0.85)';
    ctx.fillRect(bx, by, boxW, boxH);

    // Glow pulsé si meneur — amplifié par l'intensité
    if (isWinning) {
      ctx.shadowBlur = (22 + 28 * intensity) * pulse;
      ctx.shadowColor = glow;
    } else {
      ctx.shadowBlur = 6;
      ctx.shadowColor = glow;
    }

    // Bordure néon — épaissit aussi avec l'intensité
    ctx.globalAlpha = dim ? 0.35 : (isWinning ? 1 : 0.55);
    ctx.strokeStyle = color;
    ctx.lineWidth = isWinning ? 2.5 + 1.5 * intensity : 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, boxW - 1, boxH - 1);

    // Petits tirets aux coins gauche/droit — finition arcade
    ctx.shadowBlur = 0;
    ctx.globalAlpha = dim ? 0.3 : 0.9;
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(bx + 2, by - 2); ctx.lineTo(bx + 10, by - 2);
    ctx.moveTo(bx + boxW - 10, by - 2); ctx.lineTo(bx + boxW - 2, by - 2);
    ctx.moveTo(bx + 2, by + boxH + 2); ctx.lineTo(bx + 10, by + boxH + 2);
    ctx.moveTo(bx + boxW - 10, by + boxH + 2); ctx.lineTo(bx + boxW - 2, by + boxH + 2);
    ctx.stroke();

    // Label — "· WINS" rappelle que ce chrono décide de la victoire, pas le score
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = color;
    ctx.globalAlpha = dim ? 0.4 : 0.95;
    ctx.shadowBlur = 6;
    ctx.shadowColor = glow;
    ctx.fillText('LEAD TIME · WINS', bx + 8, by + 9);

    // Étoile clignotante si meneur (reste visible après KO pour marquer le vainqueur)
    if (isWinning) {
      ctx.textAlign = 'right';
      ctx.font = 'bold 11px monospace';
      ctx.globalAlpha = 0.6 + pulse * 0.4;
      ctx.fillText('★', bx + boxW - 8, by + 9);
    }

    // Chrono digital au centre — gros chiffres LED
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = isWinning ? '#ffffff' : color;
    ctx.globalAlpha = dim ? 0.45 : 1;
    ctx.shadowBlur = isWinning ? (18 + 22 * intensity) * pulse : 8;
    ctx.shadowColor = glow;
    const txt = this._formatLeadTime(timeMs);
    ctx.fillText(txt, x, by + boxH / 2 + 6);

    ctx.restore();
  }

  _formatLeadTime(ms) {
    const sec = Math.max(0, ms) / 1000;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const d = Math.floor((sec * 10) % 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${d}`;
  }

  _drawWinnerBanner(ctx, w, h, winner, elapsed) {
    ctx.save();
    const color = winner === 'AI1' ? P1_COLOR : winner === 'AI2' ? P2_COLOR : '#ffd700';
    const pulse = 0.7 + Math.sin(elapsed * 0.012) * 0.3;
    ctx.globalAlpha = pulse;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = color;
    ctx.shadowBlur = 18;
    ctx.shadowColor = color;
    const msg = winner === 'TIE' ? 'ÉGALITÉ' : winner === 'AI1' ? 'AI 1 GAGNE !' : 'AI 2 GAGNE !';
    ctx.fillText(msg, w / 2, h / 2);
    ctx.restore();
  }
}
