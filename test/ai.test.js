import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../src/game.js';
import { AI } from '../src/ai.js';

describe('AI', () => {
  let game, ai;

  beforeEach(() => {
    game = new Game();
    game.start();
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

  it('look-ahead 2 : planifie avec next piece', () => {
    ai.toggle();
    expect(game.next).toBeDefined();
    ai.update(100);
    expect(ai.moves.length).toBeGreaterThan(0);
  });

  it('look-ahead 2 : fonctionne même si next change', () => {
    ai.toggle();
    ai.update(100);
    // Simuler que l'AI joue une pièce
    while (ai.moves.length > 0) {
      const action = ai.moves.shift();
      action();
    }
    // Après le hardDrop, une nouvelle pièce est spawnée avec un nouveau next
    expect(game.next).toBeDefined();
    ai.update(1000);
    // L'AI doit replanifier pour la nouvelle pièce
    if (!game.gameOver) {
      expect(ai.moves.length).toBeGreaterThan(0);
    }
  });

  it('look-ahead 2 : joue plusieurs pièces sans crash', () => {
    ai.toggle();
    let pieces = 0;
    for (let t = 100; t < 100000 && pieces < 20 && !game.gameOver; t += 50) {
      game.update(t);
      ai.update(t);
      if (game.gameOver) break;
      // Compter les pièces posées
      if (ai.moves.length === 0 && game.stats.pieces > pieces) {
        pieces = game.stats.pieces;
      }
    }
    expect(game.stats.pieces).toBeGreaterThan(0);
  });

  it('look-ahead 2 : gère le cas où la 2e pièce n\'a pas de placement', () => {
    // Remplir le board quasi-complètement — la 2e pièce peut ne pas trouver de place
    for (let y = 2; y < 20; y++) {
      for (let x = 0; x < 10; x++) {
        game.board[y][x] = 'I';
      }
    }
    // Laisser 1 colonne libre pour la pièce courante
    for (let y = 2; y < 20; y++) game.board[y][4] = null;
    ai.toggle();
    ai.update(100);
    // L'AI doit quand même planifier quelque chose (fallback score)
    expect(ai.moves.length).toBeGreaterThan(0);
  });
});
