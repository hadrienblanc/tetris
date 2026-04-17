import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Web Audio API minimal — juste pour que le module charge sans erreur
vi.stubGlobal('AudioContext', vi.fn(() => ({
  state: 'running',
  resume: vi.fn(),
  currentTime: 0,
  createOscillator: () => ({
    type: 'square', frequency: { value: 0 },
    start: vi.fn(), stop: vi.fn(), connect: vi.fn(), disconnect: vi.fn(), onended: null,
  }),
  createGain: () => ({
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(), disconnect: vi.fn(),
  }),
  destination: {},
})));
vi.stubGlobal('webkitAudioContext', undefined);

import * as Sound from '../src/sound.js';

describe('Sound — pitch par thème', () => {
  beforeEach(() => {
    if (Sound.isMuted()) Sound.toggleMute();
    Sound.setThemePitch(1);
  });

  it('pitch par défaut est 1', () => {
    expect(Sound.getThemePitch()).toBe(1);
  });

  it('setThemePitch modifie le pitch', () => {
    Sound.setThemePitch(1.25);
    expect(Sound.getThemePitch()).toBe(1.25);
  });

  it('setThemePitch accepte les valeurs < 1', () => {
    Sound.setThemePitch(0.75);
    expect(Sound.getThemePitch()).toBe(0.75);
  });

  it('setThemePitch clamp les valeurs extrêmes', () => {
    Sound.setThemePitch(5);
    expect(Sound.getThemePitch()).toBe(2);
    Sound.setThemePitch(0);
    expect(Sound.getThemePitch()).toBe(0.1);
  });

  it('setThemePitch ignore NaN et valeurs non numériques', () => {
    Sound.setThemePitch(1.5);
    Sound.setThemePitch(NaN);
    expect(Sound.getThemePitch()).toBe(1.5); // inchangé
    Sound.setThemePitch('abc');
    expect(Sound.getThemePitch()).toBe(1.5); // inchangé
  });

  it('toggleMute et isMuted fonctionnent', () => {
    expect(Sound.isMuted()).toBe(false);
    const muted = Sound.toggleMute();
    expect(muted).toBe(true);
    expect(Sound.isMuted()).toBe(true);
    Sound.toggleMute(); // restore
  });

  it('playVictory ne lève pas d\'exception', () => {
    // Vérifie que playVictory ne crash pas
    expect(() => Sound.playVictory()).not.toThrow();
  });
});
