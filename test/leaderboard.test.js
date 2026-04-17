import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../src/game.js';

describe('Leaderboard', () => {
  let game;
  let store;

  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: (key) => store[key] ?? null,
      setItem: (key, val) => { store[key] = String(val); },
      removeItem: (key) => { delete store[key]; },
    });
    game = new Game({ marathonTarget: 5 });
  });

  it('getLeaderboard retourne un tableau vide initialement', () => {
    const board = game.getLeaderboard();
    expect(Array.isArray(board)).toBe(true);
    expect(board.length).toBe(0);
  });

  it('_saveToLeaderboard ajoute une entrée', () => {
    game._saveToLeaderboard(5000, 100);
    const board = game.getLeaderboard();
    expect(board.length).toBe(1);
    expect(board[0].time).toBe(5000);
    expect(board[0].score).toBe(100);
  });

  it('leaderboard trié par temps croissant', () => {
    game._saveToLeaderboard(5000, 100);
    game._saveToLeaderboard(3000, 200);
    const board = game.getLeaderboard();
    expect(board[0].time).toBe(3000);
    expect(board[1].time).toBe(5000);
  });

  it('leaderboard limité à 5 entrées', () => {
    for (let i = 1; i <= 7; i++) {
      game._saveToLeaderboard(i * 1000, i * 100);
    }
    const board = game.getLeaderboard();
    expect(board.length).toBe(5);
  });

  it('bestTime est le meilleur temps du leaderboard', () => {
    game._saveToLeaderboard(5000, 100);
    game._saveToLeaderboard(3000, 200);
    // Recharger depuis localStorage
    const fresh = new Game({ marathonTarget: 5 });
    expect(fresh.bestTime).toBe(3000);
  });

  it('victory ajoute au leaderboard', () => {
    game.start();
    for (let x = 0; x < 10; x++) {
      for (let y = 15; y < 20; y++) game.board[y][x] = 'I';
    }
    game.clearingRows = [15, 16, 17, 18, 19];
    game._clearTimer = 1;
    game._lastTimestamp = 1000;
    game.update(2000);
    expect(game.marathonWon).toBe(true);
    const board = game.getLeaderboard();
    expect(board.length).toBeGreaterThanOrEqual(1);
    expect(board[0].time).toBeGreaterThan(0);
  });

  it('resetScores vide le leaderboard', () => {
    game._saveToLeaderboard(3000, 100);
    game._saveToLeaderboard(5000, 200);
    game.resetScores();
    expect(game.getLeaderboard().length).toBe(0);
  });

  it('resetScores remet bestTime à 0', () => {
    game._saveToLeaderboard(3000, 100);
    const fresh = new Game({ marathonTarget: 5 });
    expect(fresh.bestTime).toBe(3000);
    fresh.resetScores();
    expect(fresh.bestTime).toBe(0);
    expect(store['tetris-leaderboard']).toBeUndefined();
  });

  it('resetScores remet highScore à 0', () => {
    store['tetris-highscore'] = '5000';
    const fresh = new Game({ marathonTarget: 5 });
    expect(fresh.highScore).toBe(5000);
    fresh.resetScores();
    expect(fresh.highScore).toBe(0);
    expect(store['tetris-highscore']).toBeUndefined();
  });
});
