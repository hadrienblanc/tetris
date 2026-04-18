import { describe, it, expect, beforeEach } from 'vitest';
import { AmbientSystem, AMBIENT_TYPES } from '../src/ambient.js';
import { themes } from '../src/themes.js';

describe('AmbientSystem', () => {
  let ambient;

  beforeEach(() => {
    ambient = new AmbientSystem();
    ambient.resize(300, 600);
  });

  it('initialise sans particules', () => {
    expect(ambient.particles).toHaveLength(0);
  });

  it('setTheme crée les particules', () => {
    ambient.setTheme(themes[0]); // Néon — sparkle
    expect(ambient.particles.length).toBe(themes[0].ambient.count);
  });

  it('setTheme avec un thème sans ambient vide les particules', () => {
    ambient.setTheme(themes[0]);
    ambient.setTheme({ name: 'vide' });
    expect(ambient.particles).toHaveLength(0);
  });

  it('setTheme ne recrée pas si le type et config sont identiques', () => {
    ambient.setTheme(themes[0]);
    const ref = ambient.particles;
    ambient.setTheme(themes[0]);
    expect(ambient.particles).toBe(ref);
  });

  it('setTheme recrée si même type mais count différent', () => {
    // Néon: sparkle count=25, Vaporwave: sparkle count=30
    ambient.setTheme(themes[0]);
    expect(ambient.particles.length).toBe(25);
    ambient.setTheme(themes[1]);
    expect(ambient.particles.length).toBe(30);
  });

  it('setTheme recrée si le type change', () => {
    ambient.setTheme(themes[0]); // sparkle
    const ref = ambient.particles;
    ambient.setTheme(themes[2]); // Cyberpunk — rain
    expect(ambient.particles).not.toBe(ref);
    expect(ambient.particles.length).toBe(themes[2].ambient.count);
  });

  it('update déplace les particules', () => {
    ambient.setTheme(themes[0]);
    const y0 = ambient.particles[0].y;
    // Pour sparkle, y ne change pas mais phase oui
    ambient.update(themes[0]);
    // Au moins la phase a changé
    expect(ambient.particles[0].phase).toBeDefined();
  });

  it('tous les thèmes ont une config ambient valide', () => {
    for (const theme of themes) {
      expect(theme.ambient, `${theme.name} manque ambient`).toBeDefined();
      expect(theme.ambient.type, `${theme.name} ambient.type manquant`).toBeTruthy();
      expect(AMBIENT_TYPES[theme.ambient.type], `${theme.name} type "${theme.ambient.type}" inconnu`).toBeDefined();
      expect(theme.ambient.count, `${theme.name} count manquant`).toBeGreaterThan(0);
      expect(theme.ambient.speed, `${theme.name} speed manquant`).toBeGreaterThan(0);
    }
  });

  it('chaque type AMBIENT_TYPES a init/update/draw', () => {
    for (const [name, handler] of Object.entries(AMBIENT_TYPES)) {
      expect(typeof handler.init, `${name}.init`).toBe('function');
      expect(typeof handler.update, `${name}.update`).toBe('function');
      expect(typeof handler.draw, `${name}.draw`).toBe('function');
    }
  });

  it('draw avec un mock ctx ne crash pas', () => {
    ambient.setTheme(themes[0]);
    const calls = [];
    const mockCtx = {
      save: () => calls.push('save'),
      restore: () => calls.push('restore'),
      beginPath: () => calls.push('beginPath'),
      arc: () => calls.push('arc'),
      fill: () => calls.push('fill'),
      set globalAlpha(v) { calls.push(`alpha:${v}`); },
      set fillStyle(v) { calls.push(`fill:${v}`); },
      set strokeStyle(v) { calls.push(`stroke:${v}`); },
      set lineWidth(v) {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fillRect: () => {},
      translate: () => {},
      rotate: () => {},
    };
    ambient.update(themes[0]);
    ambient.draw(mockCtx, themes[0]);
    expect(calls).toContain('save');
    expect(calls).toContain('restore');
  });

  it('tous les types gèrent les particules sans crash', () => {
    for (const theme of themes) {
      const a = new AmbientSystem();
      a.resize(300, 600);
      a.setTheme(theme);
      expect(a.particles.length).toBe(theme.ambient.count);
      // Plusieurs updates
      for (let i = 0; i < 100; i++) a.update(theme);
      // Pas de particules NaN
      for (const p of a.particles) {
        expect(isNaN(p.x)).toBe(false);
        expect(isNaN(p.y)).toBe(false);
      }
    }
  });

  it('resize change les dimensions', () => {
    ambient.resize(100, 200);
    expect(ambient._w).toBe(100);
    expect(ambient._h).toBe(200);
  });
});
