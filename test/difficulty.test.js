import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game, DIFFICULTY } from '../src/game.js';

describe('Difficulty', () => {
  let game;
  let store;

  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: (key) => store[key] ?? null,
      setItem: (key, val) => { store[key] = String(val); },
    });
  });

  it('défaut est normal', () => {
    game = new Game();
    expect(game.difficulty).toBe('normal');
    expect(game._diffConfig.intervalMul).toBe(1);
    expect(game._diffConfig.scoreMul).toBe(1);
  });

  it('setDifficulty change la config', () => {
    game = new Game({ difficulty: 'easy' });
    expect(game.difficulty).toBe('easy');
    expect(game._diffConfig.intervalMul).toBe(1.8);
    expect(game._diffConfig.scoreMul).toBe(0.5);
  });

  it('setDifficulty ignore un nom invalide', () => {
    game = new Game({ difficulty: 'impossible' });
    expect(game.difficulty).toBe('normal');
  });

  it('DIFFICULTY exporte les 3 niveaux', () => {
    expect(Object.keys(DIFFICULTY).sort()).toEqual(['easy', 'hard', 'normal']);
  });

  it('easy a un intervalle plus long', () => {
    const easyGame = new Game({ difficulty: 'easy' });
    const normalGame = new Game();
    const easyInterval = easyGame._diffConfig.intervalMul * (800 - 0 * 70);
    const normalInterval = normalGame._diffConfig.intervalMul * (800 - 0 * 70);
    expect(easyInterval).toBeGreaterThan(normalInterval);
  });

  it('hard a un score multiplié', () => {
    game = new Game({ difficulty: 'hard' });
    game.start();
    // Remplir une ligne complète pour tester le scoring
    for (let x = 0; x < 10; x++) game.board[19][x] = 'I';
    game.clearingRows = [19];
    game._clearTimer = 1;
    game._lastTimestamp = 1000;
    game.update(1200);
    // Score hard = 2× le score normal
    // Normal niveau 1, 1 ligne = 100 × 1 = 100, hard = 200
    expect(game.score).toBe(200);
  });

  it('getDifficultyLabel retourne le label', () => {
    game = new Game({ difficulty: 'hard' });
    expect(game.getDifficultyLabel()).toBe('Difficile');
  });
});
