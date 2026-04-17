import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Web Audio API
const mockOscillator = {
  type: 'square',
  frequency: { value: 0 },
  start: vi.fn(),
  stop: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  onended: null,
};
const mockGain = {
  gain: {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
  connect: vi.fn(),
  disconnect: vi.fn(),
};

vi.stubGlobal('AudioContext', vi.fn(() => ({
  state: 'running',
  resume: vi.fn(),
  currentTime: 0,
  createOscillator: () => ({ ...mockOscillator, frequency: { value: 0 } }),
  createGain: () => mockGain,
  destination: {},
})));
vi.stubGlobal('webkitAudioContext', undefined);

import * as Sound from '../src/sound.js';

describe('Sound — pitch par thème', () => {
  beforeEach(() => {
    // Reset pitch avant chaque test
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

  it('toggleMute et isMuted fonctionnent', () => {
    expect(Sound.isMuted()).toBe(false);
    const muted = Sound.toggleMute();
    expect(muted).toBe(true);
    expect(Sound.isMuted()).toBe(true);
    Sound.toggleMute(); // restore
  });
});
