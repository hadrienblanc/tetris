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
    Sound.setThemeWaveform('square');
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

  it('setThemeWaveform accepte les waveforms valides', () => {
    Sound.setThemeWaveform('sine');
    expect(Sound.getThemeWaveform()).toBe('sine');
    Sound.setThemeWaveform('sawtooth');
    expect(Sound.getThemeWaveform()).toBe('sawtooth');
  });

  it('setThemeWaveform ignore les waveforms invalides', () => {
    Sound.setThemeWaveform('sine');
    Sound.setThemeWaveform('invalid');
    expect(Sound.getThemeWaveform()).toBe('sine');
  });

  it('playGameOver ne lève pas d\'exception sans difficulté', () => {
    expect(() => Sound.playGameOver()).not.toThrow();
  });

  it('playGameOver ne lève pas d\'exception avec difficulté easy', () => {
    expect(() => Sound.playGameOver('easy')).not.toThrow();
  });

  it('playGameOver ne lève pas d\'exception avec difficulté hard', () => {
    expect(() => Sound.playGameOver('hard')).not.toThrow();
  });

  it('playGameOver ne lève pas d\'exception avec difficulté normal', () => {
    expect(() => Sound.playGameOver('normal')).not.toThrow();
  });

  it('playLevelUp ne lève pas d\'exception sans difficulté', () => {
    expect(() => Sound.playLevelUp()).not.toThrow();
  });

  it('playLevelUp ne lève pas d\'exception avec difficulté easy', () => {
    expect(() => Sound.playLevelUp('easy')).not.toThrow();
  });

  it('playLevelUp ne lève pas d\'exception avec difficulté hard', () => {
    expect(() => Sound.playLevelUp('hard')).not.toThrow();
  });

  it('playLevelUp avec difficulté normal ne lève pas d\'exception', () => {
    expect(() => Sound.playLevelUp('normal')).not.toThrow();
  });

  it('playVictory ne lève pas d\'exception sans difficulté', () => {
    expect(() => Sound.playVictory()).not.toThrow();
  });

  it('playVictory ne lève pas d\'exception avec difficulté easy', () => {
    expect(() => Sound.playVictory('easy')).not.toThrow();
  });

  it('playVictory ne lève pas d\'exception avec difficulté hard', () => {
    expect(() => Sound.playVictory('hard')).not.toThrow();
  });

  it('playVictory ne lève pas d\'exception avec difficulté normal', () => {
    expect(() => Sound.playVictory('normal')).not.toThrow();
  });
});
