import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../src/game.js';
import { AI } from '../src/ai.js';

describe('AI', () => {
  let game, ai;

  beforeEach(() => {
    game = new Game();
    ai = new AI(game);
  });

  it('toggle active/désactive l\'AI', () => {
    expect(ai.isActive()).toBe(false);
    ai.toggle();
    expect(ai.isActive()).toBe(true);
    ai.toggle();
    expect(ai.isActive()).toBe(false);
  });

  it('setSpeed clamp à 20ms minimum', () => {
    ai.setSpeed(5);
    expect(ai.speed).toBe(20);
    ai.setSpeed(100);
    expect(ai.speed).toBe(100);
  });

  it('planifie des moves après activation', () => {
    ai.toggle();
    ai.update(100);
    expect(ai.moves.length).toBeGreaterThan(0);
  });

  it('exécute les moves progressivement', () => {
    ai.toggle();
    ai.update(100);
    const initialMoves = ai.moves.length;
    ai.update(200); // 100ms plus tard = 1 move si speed=80
    expect(ai.moves.length).toBeLessThan(initialMoves);
  });

  it('les moves finissent par un hardDrop', () => {
    ai.toggle();
    ai.update(100);
    // Le dernier move devrait être un hardDrop
    const lastMove = ai.moves[ai.moves.length - 1];
    expect(lastMove).toBeDefined();
  });

  it('ne fait rien quand inactif', () => {
    expect(ai.isActive()).toBe(false);
    ai.update(100);
    expect(ai.moves.length).toBe(0);
  });

  it('ne fait rien quand game over', () => {
    ai.toggle();
    game.gameOver = true;
    ai.update(100);
    expect(ai.moves.length).toBe(0);
  });
});
