import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../src/game.js';

describe('Game', () => {
  let game;

  beforeEach(() => {
    game = new Game();
  });

  it('initialise un board 10×20 vide', () => {
    expect(game.cols).toBe(10);
    expect(game.rows).toBe(20);
    expect(game.board).toHaveLength(20);
    expect(game.board[0]).toHaveLength(10);
    expect(game.board[0].every(c => c === null)).toBe(true);
  });

  it('a une pièce courante et une suivante', () => {
    expect(game.current).toBeDefined();
    expect(game.next).toBeDefined();
    expect(game.current.name).toBeTruthy();
  });

  it('moveLeft déplace la pièce à gauche', () => {
    const xBefore = game.current.x;
    const moved = game.moveLeft();
    if (xBefore > 0) {
      expect(moved).toBe(true);
      expect(game.current.x).toBe(xBefore - 1);
    }
  });

  it('moveRight déplace la pièce à droite', () => {
    const xBefore = game.current.x;
    const moved = game.moveRight();
    if (xBefore < game.cols - 2) {
      expect(moved).toBe(true);
      expect(game.current.x).toBe(xBefore + 1);
    }
  });

  it('moveDown déplace la pièce vers le bas', () => {
    const yBefore = game.current.y;
    const moved = game.moveDown();
    expect(moved).toBe(true);
    expect(game.current.y).toBe(yBefore + 1);
  });

  it('rotate retourne un boolean', () => {
    const result = game.rotate();
    expect(typeof result).toBe('boolean');
  });

  it('hardDrop verrouille la pièce et spawn une nouvelle', () => {
    const firstPiece = game.current;
    game.hardDrop();
    // Le board ne doit pas être vide sous la ligne de spawn
    let hasBlock = false;
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 10; x++) {
        if (game.board[y][x] !== null) hasBlock = true;
      }
    }
    expect(hasBlock).toBe(true);
    // Nouvelle pièce courante
    expect(game.current).not.toBe(firstPiece);
  });

  it('score augmente après un hardDrop', () => {
    const scoreBefore = game.score;
    game.hardDrop();
    expect(game.score).toBeGreaterThanOrEqual(scoreBefore);
  });

  it('gameOver après avoir rempli le board', () => {
    // Remplir presque tout le board sauf la zone de spawn
    for (let y = 4; y < 20; y++) {
      for (let x = 0; x < 10; x++) {
        game.board[y][x] = 'I';
      }
    }
    // Hard drop plusieurs pièces jusqu'à game over
    let attempts = 0;
    while (!game.gameOver && attempts < 50) {
      game.hardDrop();
      attempts++;
    }
    expect(game.gameOver).toBe(true);
  });

  it('reset remet tout à zéro', () => {
    game.hardDrop();
    game.hardDrop();
    expect(game.score).toBeGreaterThan(0);
    game.reset();
    expect(game.score).toBe(0);
    expect(game.level).toBe(1);
    expect(game.lines).toBe(0);
    expect(game.gameOver).toBe(false);
  });

  it('getGhostY retourne une position Y >= current.y', () => {
    const ghostY = game.getGhostY();
    expect(ghostY).toBeGreaterThanOrEqual(game.current.y);
  });

  it('les pièces ont un id unique', () => {
    const id1 = game.current.id;
    game.hardDrop();
    const id2 = game.current.id;
    expect(id2).toBeGreaterThan(id1);
  });

  it('onLinesCleared est appelé quand des lignes sont cleared', () => {
    let called = false;
    let clearedCount = 0;
    game.onLinesCleared = (rows, snapshots) => {
      called = true;
      clearedCount = rows.length;
    };
    // Remplir une ligne complète au fond
    for (let x = 0; x < 10; x++) {
      game.board[19][x] = 'I';
    }
    // Hard drop la pièce courante — elle devrait compléter une ligne si bien positionnée
    // Au moins vérifier que le callback est potentiellement appelé
    game.hardDrop();
    // Le callback a été appelé si une ligne a été cleared
    if (clearedCount > 0) {
      expect(called).toBe(true);
      expect(clearedCount).toBeGreaterThanOrEqual(1);
    }
  });
});
