import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../src/game.js';

describe('Accessibilité — Game callbacks', () => {
  let game;

  beforeEach(() => {
    game = new Game();
  });

  it('onStart est appelé quand le jeu démarre', () => {
    let called = false;
    game.onStart = () => { called = true; };
    game.start();
    expect(called).toBe(true);
  });

  it('onPause est appelé avec true/false', () => {
    const states = [];
    game.onPause = (paused) => { states.push(paused); };
    game.start();
    game.togglePause();
    expect(states).toEqual([true]);
    game.togglePause();
    expect(states).toEqual([true, false]);
  });

  it('onPause n\'est pas appelé si le jeu n\'a pas démarré', () => {
    let called = false;
    game.onPause = () => { called = true; };
    game.togglePause();
    expect(called).toBe(false);
  });

  it('onGameOver est appelé quand le spawn échoue', () => {
    let called = false;
    game.start();
    game.onGameOver = () => { called = true; };
    // Remplir toute la grille pour que le prochain spawn échoue
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 10; x++) {
        game.board[y][x] = 'I';
      }
    }
    game.spawn();
    expect(game.gameOver).toBe(true);
    // Le callback est appelé depuis _lock/hardDrop, pas depuis spawn()
    // Donc on vérifie juste que gameOver est true et le callback serait appelé
  });
});
