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
    expect(ps.particles.length).toBeLessThanOrEqual(400);
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

  it('emitFirework crée des particules rondes aux couleurs données', () => {
    const ps = new ParticleSystem();
    ps.emitFirework(150, 200, ['#ff0000', '#00ff00', '#0000ff']);
    expect(ps.particles.length).toBeGreaterThanOrEqual(20);
    const colors = new Set(ps.particles.map(p => p.color));
    expect(colors.size).toBeGreaterThanOrEqual(1);
    // Toutes les particules sont rondes
    expect(ps.particles.every(p => p.round)).toBe(true);
  });

  it('emitExplosion crée des particules sombres carrées', () => {
    const ps = new ParticleSystem();
    ps.emitExplosion(150, 200);
    expect(ps.particles.length).toBeGreaterThanOrEqual(30);
    const darkColors = ['#222', '#444', '#666', '#888', '#c00', '#f44'];
    expect(ps.particles.every(p => darkColors.includes(p.color))).toBe(true);
    // Toutes carrées (round=false)
    expect(ps.particles.every(p => !p.round)).toBe(true);
  });

  it('emitExplosion respecte la limite MAX_PARTICLES', () => {
    const ps = new ParticleSystem();
    for (let i = 0; i < 39; i++) ps.emit(0, 0, '#fff', 30);
    ps.emitExplosion(150, 200);
    expect(ps.particles.length).toBeLessThanOrEqual(400);
  });

  it('emitFirework respecte la limite MAX_PARTICLES', () => {
    const ps = new ParticleSystem();
    // Remplir presque max
    for (let i = 0; i < 39; i++) ps.emit(0, 0, '#fff', 30);
    const before = ps.particles.length;
    ps.emitFirework(150, 200, ['#fff']);
    expect(ps.particles.length).toBeLessThanOrEqual(400);
  });
});
