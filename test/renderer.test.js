import { describe, it, expect } from 'vitest';

// Test de la logique d'interpolation du score counter
// (extrait du renderer, pas besoin de DOM)
function interpolateScore(displayScore, targetScore) {
  if (displayScore === targetScore) return displayScore;
  const diff = targetScore - displayScore;
  const next = displayScore + (Math.ceil(diff * 0.3) || diff);
  if (Math.abs(next - targetScore) < 2) return targetScore;
  return next;
}

describe('Score counter animation', () => {
  it('reste identique si déjà au target', () => {
    expect(interpolateScore(100, 100)).toBe(100);
  });

  it('interpole vers le haut par incrément', () => {
    let display = 0;
    const target = 100;
    display = interpolateScore(display, target);
    expect(display).toBeGreaterThan(0);
    expect(display).toBeLessThan(target);
  });

  it('atteint le target en plusieurs frames', () => {
    let display = 0;
    for (let i = 0; i < 20; i++) display = interpolateScore(display, 100);
    expect(display).toBe(100);
  });

  it('interpole vers le bas', () => {
    let display = 100;
    for (let i = 0; i < 20; i++) display = interpolateScore(display, 0);
    expect(display).toBe(0);
  });

  it('fonctionne avec de grands scores', () => {
    let display = 0;
    for (let i = 0; i < 30; i++) display = interpolateScore(display, 99999);
    expect(display).toBe(99999);
  });

  it('fonctionne avec un petit delta', () => {
    let display = 98;
    const result = interpolateScore(display, 100);
    expect(result).toBe(100); // diff = 2, ceil(2 * 0.3) = 1, 98 + 1 = 99, abs(99-100) < 2 => 100
  });
});
