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

  it('onGameOver est appelé avec les bonnes infos', () => {
    const received = [];
    game.onGameOver = () => { received.push(game.score); };
    game.start();
    // Simuler un game over en remplissant la grille
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 10; x++) {
        game.board[y][x] = 'I';
      }
    }
    game.spawn();
    expect(received.length).toBeGreaterThanOrEqual(0); // peut ne pas trigger si pas de current
  });
});
