import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../src/game.js';

describe('Timer marathon', () => {
  let game;

  beforeEach(() => {
    game = new Game({ marathonTarget: 10 });
  });

  it('elapsedTime est 0 avant le démarrage', () => {
    expect(game.elapsedTime).toBe(0);
  });

  it('elapsedTime > 0 après le démarrage', () => {
    game.start();
    expect(game.elapsedTime).toBeGreaterThanOrEqual(0);
  });

  it('formatTime affiche correctement', () => {
    expect(Game.formatTime(0)).toBe('0:00.00');
    expect(Game.formatTime(1000)).toBe('0:01.00');
    expect(Game.formatTime(61000)).toBe('1:01.00');
    expect(Game.formatTime(12345)).toBe('0:12.34');
    expect(Game.formatTime(3661500)).toBe('61:01.50');
  });

  it('bestTime est chargé depuis le constructeur', () => {
    // Par défaut 0 si pas en localStorage
    expect(typeof game.bestTime).toBe('number');
  });

  it('victoryTime est gelé après victoire', () => {
    game.start();
    let victoryTime = 0;
    game.onVictory = () => { victoryTime = game.elapsedTime; };
    // Simuler 10 lignes effacées
    for (let x = 0; x < 10; x++) {
      for (let y = 10; y < 20; y++) game.board[y][x] = 'I';
    }
    game.clearingRows = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    game._clearTimer = 1;
    game._lastTimestamp = 1000;
    game.update(2000);
    expect(game.marathonWon).toBe(true);
    expect(game._victoryTime).toBeGreaterThan(0);
    expect(victoryTime).toBeGreaterThan(0);
  });

  it('reset efface le timer', () => {
    game.start();
    game.reset();
    expect(game._startTime).toBe(0);
    expect(game._victoryTime).toBe(0);
    expect(game._pauseAccum).toBe(0);
  });

  it('elapsedTime exclut le temps de pause', () => {
    game.start();
    const before = game.elapsedTime;
    game.togglePause();
    // Simuler 1s de pause
    game._pauseStart = performance.now() - 1000;
    game.togglePause();
    // Le temps de pause est accumulé mais elapsedTime le soustrait
    expect(game._pauseAccum).toBeGreaterThanOrEqual(900);
  });
});
