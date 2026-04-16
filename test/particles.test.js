import { describe, it, expect } from 'vitest';
import { ParticleSystem } from '../src/particles.js';

describe('ParticleSystem', () => {
  it('émet des particules', () => {
    const ps = new ParticleSystem();
    ps.emit(10, 5, '#ff0000', 30);
    expect(ps.particles.length).toBeGreaterThan(0);
  });

  it('respecte la limite MAX_PARTICLES', () => {
    const ps = new ParticleSystem();
    for (let i = 0; i < 300; i++) {
      ps.emit(0, 0, '#fff', 30);
    }
    expect(ps.particles.length).toBeLessThanOrEqual(200);
  });

  it('update fait décroître la vie des particules', () => {
    const ps = new ParticleSystem();
    ps.emit(0, 0, '#fff', 30);
    const lifeBefore = ps.particles[0].life;
    ps.update();
    expect(ps.particles[0].life).toBeLessThan(lifeBefore);
  });

  it('les particules mortes sont retirées', () => {
    const ps = new ParticleSystem();
    ps.emit(0, 0, '#fff', 30);
    // Forcer la mort de toutes les particules
    for (const p of ps.particles) p.life = 0.001;
    ps.update();
    expect(ps.particles.length).toBe(0);
  });

  it('emitRowFromSnapshot utilise les couleurs du snapshot', () => {
    const ps = new ParticleSystem();
    const snapshot = ['I', 'T', 'S', null, 'Z', 'J', 'L', 'O', 'I', 'T'];
    const theme = { cells: { I: '#0ff', T: '#a0f', S: '#0f0', Z: '#f00', J: '#00f', L: '#f90', O: '#ff0' } };
    ps.emitRowFromSnapshot(0, snapshot, 30, theme);
    expect(ps.particles.length).toBeGreaterThan(0);
    // Vérifier qu'on a des couleurs du thème
    const colors = ps.particles.map(p => p.color);
    expect(colors.some(c => c !== '#fff')).toBe(true);
  });
});
