import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../src/game.js';

describe('Mode marathon', () => {
  let game;

  beforeEach(() => {
    game = new Game({ marathonTarget: 10 });
    game.start();
  });

  it('marathonTarget est défini', () => {
    expect(game.marathonTarget).toBe(10);
  });

  it('marathonWon est false au départ', () => {
    expect(game.marathonWon).toBe(false);
  });

  it('victoire déclenchée quand lignes >= target', () => {
    let victoryCalled = false;
    game.onVictory = () => { victoryCalled = true; };
    // Simuler l'effacement de lignes en appelant _finishClear manuellement
    // Remplir des lignes complètes
    for (let x = 0; x < 10; x++) {
      game.board[19][x] = 'I';
      game.board[18][x] = 'I';
      game.board[17][x] = 'I';
      game.board[16][x] = 'I';
      game.board[15][x] = 'I';
      game.board[14][x] = 'I';
      game.board[13][x] = 'I';
      game.board[12][x] = 'I';
      game.board[11][x] = 'I';
      game.board[10][x] = 'I';
    }
    game.clearingRows = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    game._clearTimer = 1;
    game._lastTimestamp = 1000;
    // Avancer le temps pour déclencher _finishClear
    game.update(2000);
    expect(game.marathonWon).toBe(true);
    expect(victoryCalled).toBe(true);
  });

  it('pas de victoire si lignes < target', () => {
    let victoryCalled = false;
    game.onVictory = () => { victoryCalled = true; };
    // Remplir seulement 5 lignes
    for (let x = 0; x < 10; x++) {
      game.board[19][x] = 'I';
      game.board[18][x] = 'I';
      game.board[17][x] = 'I';
      game.board[16][x] = 'I';
      game.board[15][x] = 'I';
    }
    game.clearingRows = [15, 16, 17, 18, 19];
    game._clearTimer = 1;
    game._lastTimestamp = 1000;
    game.update(2000);
    expect(game.marathonWon).toBe(false);
    expect(victoryCalled).toBe(false);
  });

  it('reset efface marathonWon', () => {
    game.marathonWon = true;
    game.reset();
    expect(game.marathonWon).toBe(false);
  });

  it('marathonTarget=0 signifie infini (pas de victoire)', () => {
    const infinite = new Game({ marathonTarget: 0 });
    infinite.start();
    expect(infinite.marathonTarget).toBe(0);
    expect(infinite.marathonWon).toBe(false);
  });

  it('_actionGuard bloque les actions quand marathonWon', () => {
    game.marathonWon = true;
    expect(game._actionGuard()).toBe(false);
    expect(game.moveLeft()).toBe(false);
  });
});
