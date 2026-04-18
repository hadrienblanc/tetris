import { describe, it, expect, beforeEach } from 'vitest';
import { VersusAmbient, ANIMATION_LABELS } from '../src/versusAmbient.js';

function makeMockCanvas() {
  const calls = [];
  const mockCtx = {
    _calls: calls,
    clearRect: () => calls.push('clearRect'),
    fillRect: () => calls.push('fillRect'),
    strokeRect: () => {},
    fillText: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    ellipse: () => {},
    closePath: () => {},
    stroke: () => {},
    fill: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    quadraticCurveTo: () => {},
    set lineCap(v) {}, get lineCap() { return ''; },
    set fillStyle(v) {}, get fillStyle() { return ''; },
    set strokeStyle(v) {}, get strokeStyle() { return ''; },
    set shadowColor(v) {}, get shadowColor() { return ''; },
    set shadowBlur(v) {}, get shadowBlur() { return 0; },
    set lineWidth(v) {}, get lineWidth() { return 1; },
    set globalAlpha(v) {}, get globalAlpha() { return 1; },
    set font(v) {}, get font() { return ''; },
  };
  return {
    width: 0,
    height: 0,
    getContext: () => mockCtx,
    _ctx: mockCtx,
  };
}

describe('VersusAmbient', () => {
  let ambient;
  let canvas;

  beforeEach(() => {
    canvas = makeMockCanvas();
    ambient = new VersusAmbient(canvas);
    ambient.resize(800, 600);
  });

  it('expose 10 animations', () => {
    expect(ambient.animations).toHaveLength(10);
    expect(ANIMATION_LABELS).toHaveLength(10);
  });

  it('resize met canvas aux bonnes dimensions et init toutes les anims', () => {
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
    expect(ambient.w).toBe(800);
    expect(ambient.h).toBe(600);
  });

  it('démarre à l\'index 0 (Starfield)', () => {
    expect(ambient.currentIndex).toBe(0);
    expect(ambient.label).toBe('Starfield');
  });

  it('next() incrémente l\'index avec wrap', () => {
    ambient.start();
    ambient.next();
    expect(ambient.currentIndex).toBe(1);
    for (let i = 0; i < 9; i++) ambient.next();
    expect(ambient.currentIndex).toBe(0); // wrap 10 → 0
  });

  it('setIndex wrap négatif', () => {
    ambient.setIndex(-1, { instant: true });
    expect(ambient.currentIndex).toBe(9);
  });

  it('update sans start() est no-op', () => {
    canvas._ctx._calls.length = 0;
    ambient.update(100);
    expect(canvas._ctx._calls).toHaveLength(0);
  });

  it('onLabelChange est appelé sur start() et setIndex()', () => {
    const labels = [];
    ambient.onLabelChange = (l) => labels.push(l);
    ambient.start();
    ambient.setIndex(3, { instant: true });
    expect(labels).toEqual(['Starfield', 'Vaporwave']);
  });

  it('toutes les animations survivent à un cycle complet sans crash', () => {
    ambient.start();
    for (let i = 0; i < 10; i++) {
      ambient.setIndex(i, { instant: true });
      // plusieurs frames pour que les spawners déclenchent
      for (let f = 0; f < 30; f++) {
        ambient.update(i * 1000 + f * 40);
      }
    }
    expect(ambient.currentIndex).toBe(9);
  });

  it('stop() désactive les updates', () => {
    ambient.start();
    ambient.update(16);
    canvas._ctx._calls.length = 0;
    ambient.stop();
    ambient.update(200);
    expect(canvas._ctx._calls).toHaveLength(0);
  });

  it('le cycle auto passe à l\'animation suivante après CYCLE_MS', () => {
    ambient.start();
    // 12s simulés par pas de 200ms (en-dessous du clamp anti-tab-blur de 250ms)
    for (let t = 0; t <= 12_000; t += 200) ambient.update(t);
    expect(ambient.currentIndex).toBe(1);
  });
});
