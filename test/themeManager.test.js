import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeManager } from '../src/themeManager.js';

function mockRenderer() {
  const calls = { setTheme: [], setTransition: [] };
  return {
    calls,
    setTheme: (theme) => calls.setTheme.push(theme),
    setTransition: (from, to, progress) => calls.setTransition.push({ from, to, progress }),
  };
}

describe('ThemeManager', () => {
  let renderer, tm;

  beforeEach(() => {
    renderer = mockRenderer();
    tm = new ThemeManager(renderer);
  });

  it('initialise avec le premier thème', () => {
    expect(tm.index).toBe(0);
    expect(tm.getName()).toBeTruthy();
  });

  it('setLevel change de thème tous les 2 niveaux', () => {
    tm.setLevel(1);
    expect(tm.index).toBe(0);
    tm.setLevel(2);
    expect(tm.index).toBe(0);
    tm.setLevel(3);
    expect(tm.index).toBe(1);
    tm.setLevel(5);
    expect(tm.index).toBe(2);
  });

  it('setLevel ne dépasse pas le nombre de thèmes', () => {
    tm.setLevel(99);
    expect(tm.index).toBeLessThan(10); // 10 thèmes
  });

  it('setLevel déclenche une transition', () => {
    tm.setLevel(3);
    expect(tm.transitioning).toBe(true);
    expect(tm.transitionProgress).toBe(0);
  });

  it('setLevel active le mode niveau', () => {
    tm.setLevel(3);
    expect(tm._levelMode).toBe(true);
  });

  it('en mode niveau le timer ne cycle plus', () => {
    tm.setLevel(3);
    // Simuler une transition terminée
    tm.transitioning = false;
    tm.transitionProgress = 1;
    const idxBefore = tm.index;
    tm.started = true;
    tm.lastCycle = 0;
    tm.update(20000); // > 10s
    expect(tm.index).toBe(idxBefore); // pas changé
  });

  it('setLevel ignore les niveaux invalides', () => {
    const idx = tm.index;
    tm.setLevel(0);
    expect(tm.index).toBe(idx);
    tm.setLevel(-1);
    expect(tm.index).toBe(idx);
    tm.setLevel(null);
    expect(tm.index).toBe(idx);
  });

  it('setLevel ne re-déclenche pas si même index', () => {
    tm.setLevel(1); // index 0
    tm.transitioning = false;
    tm.setLevel(2); // toujours index 0
    expect(tm.transitioning).toBe(false);
  });

  it('next cycle manuellement', () => {
    const prev = tm.index;
    tm.next();
    expect(tm.index).toBe((prev + 1) % 10);
  });
});
