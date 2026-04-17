import { describe, it, expect, beforeEach } from 'vitest';
import { AmbientSystem } from '../src/ambient.js';
import { themes } from '../src/themes.js';

describe('Ambient resize', () => {
  let ambient;

  beforeEach(() => {
    ambient = new AmbientSystem();
  });

  it('resize met à jour les dimensions', () => {
    ambient.resize(200, 400);
    expect(ambient._w).toBe(200);
    expect(ambient._h).toBe(400);
  });

  it('resize puis setTheme initialise les particules dans les bornes', () => {
    ambient.resize(200, 400);
    ambient.setTheme(themes[0]);
    expect(ambient.particles.length).toBeGreaterThan(0);
    for (const p of ambient.particles) {
      expect(p.x).toBeGreaterThanOrEqual(-10);
      expect(p.x).toBeLessThanOrEqual(210);
      expect(p.y).toBeGreaterThanOrEqual(-10);
      expect(p.y).toBeLessThanOrEqual(410);
    }
  });

  it('resize après setTheme ne casse pas les particules', () => {
    ambient.resize(300, 600);
    ambient.setTheme(themes[0]);
    expect(ambient.particles.length).toBeGreaterThan(0);
    ambient.resize(200, 400);
    // Les particules existent toujours après resize
    expect(ambient.particles.length).toBeGreaterThan(0);
    for (let i = 0; i < 50; i++) ambient.update(themes[0]);
    for (const p of ambient.particles) {
      expect(isNaN(p.x)).toBe(false);
      expect(isNaN(p.y)).toBe(false);
    }
  });
});
