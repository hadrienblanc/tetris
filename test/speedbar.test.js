import { describe, it, expect } from 'vitest';

function speedBarColor(val) {
  const t = (val - 20) / (1000 - 20);
  const r = Math.round(t * 255);
  const g = Math.round((1 - t) * 200);
  return `rgb(${r},${g},60)`;
}

function speedBarWidth(val) {
  const t = (val - 20) / (1000 - 20);
  return `${(1 - t) * 100}%`;
}

describe('AI speed bar', () => {
  it('rapide (20ms) = vert', () => {
    expect(speedBarColor(20)).toBe('rgb(0,200,60)');
    expect(speedBarWidth(20)).toBe('100%');
  });

  it('lent (1000ms) = rouge', () => {
    expect(speedBarColor(1000)).toBe('rgb(255,0,60)');
    expect(speedBarWidth(1000)).toBe('0%');
  });

  it('milieu (510ms) = mixte', () => {
    const t = (510 - 20) / (1000 - 20);
    const r = Math.round(t * 255);
    const g = Math.round((1 - t) * 200);
    expect(speedBarColor(510)).toBe(`rgb(${r},${g},60)`);
  });

  it('width décroît quand la vitesse augmente', () => {
    const w1 = parseFloat(speedBarWidth(50));
    const w2 = parseFloat(speedBarWidth(700));
    expect(w1).toBeGreaterThan(w2);
  });
});
