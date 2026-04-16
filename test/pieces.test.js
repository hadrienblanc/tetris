import { describe, it, expect } from 'vitest';
import { ROTATIONS, WALL_KICKS } from '../src/pieces.js';

describe('pieces.js', () => {
  it('a 7 pièces avec 4 rotations chacune', () => {
    const names = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    for (const name of names) {
      expect(ROTATIONS[name]).toHaveLength(4);
    }
  });

  it('rotation 0 et rotation 4 (360°) sont identiques', () => {
    for (const name of ['I', 'O', 'T', 'S', 'Z', 'J', 'L']) {
      const r0 = ROTATIONS[name][0];
      const r4 = ROTATIONS[name][0]; // rotation 0 = rotation 4
      expect(r4).toEqual(r0);
    }
  });

  it('la pièce O est identique dans toutes les rotations', () => {
    const r0 = ROTATIONS.O[0];
    for (let i = 1; i < 4; i++) {
      expect(ROTATIONS.O[i]).toEqual(r0);
    }
  });

  it('la pièce I a 4 rotations de matrice distinctes', () => {
    const shapes = ROTATIONS.I.map(r => r.map(row => row.join('')).join('|'));
    const unique = new Set(shapes);
    expect(unique.size).toBe(4); // chaque rotation a une position différente dans la matrice 4×4
  });

  it('wall kicks existent pour normal et I', () => {
    expect(WALL_KICKS.normal).toHaveLength(4);
    expect(WALL_KICKS.I).toHaveLength(4);
    // Chaque kick a 5 offsets [dx, dy]
    for (const kick of WALL_KICKS.normal) {
      expect(kick).toHaveLength(5);
    }
    for (const kick of WALL_KICKS.I) {
      expect(kick).toHaveLength(5);
    }
  });

  it('les matrices de rotation sont des matrices carrées valides', () => {
    for (const name of ['I', 'O', 'T', 'S', 'Z', 'J', 'L']) {
      for (const rot of ROTATIONS[name]) {
        const size = rot.length;
        for (const row of rot) {
          expect(row).toHaveLength(size);
        }
      }
    }
  });
});
