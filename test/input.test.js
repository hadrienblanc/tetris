import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Input } from '../src/input.js';
import { Game } from '../src/game.js';

// Mock document et window pour le constructeur Input
let blurCallbacks = [];
vi.stubGlobal('document', {
  addEventListener: vi.fn(),
});
vi.stubGlobal('window', {
  addEventListener: (event, cb) => {
    if (event === 'blur') blurCallbacks.push(cb);
  },
});

describe('Input', () => {
  let game, input;
  let store;

  beforeEach(() => {
    store = {};
    blurCallbacks = [];
    vi.stubGlobal('localStorage', {
      getItem: (key) => store[key] ?? null,
      setItem: (key, val) => { store[key] = String(val); },
    });
    game = new Game();
    game.start();
    input = new Input(game);
  });

  it('DAS delay par défaut est 170', () => {
    expect(input.dasDelay).toBe(170);
  });

  it('DAS repeat par défaut est 50', () => {
    expect(input.dasRepeat).toBe(50);
  });

  it('setDasDelay clamp entre 50 et 500', () => {
    input.setDasDelay(10);
    expect(input.dasDelay).toBe(50);
    input.setDasDelay(600);
    expect(input.dasDelay).toBe(500);
    input.setDasDelay(200);
    expect(input.dasDelay).toBe(200);
  });

  it('setDasRepeat clamp entre 16 et 200', () => {
    input.setDasRepeat(5);
    expect(input.dasRepeat).toBe(16);
    input.setDasRepeat(300);
    expect(input.dasRepeat).toBe(200);
    input.setDasRepeat(30);
    expect(input.dasRepeat).toBe(30);
  });

  it('setDasDelay sauvegarde dans localStorage', () => {
    input.setDasDelay(250);
    expect(store['tetris-das-delay']).toBe('250');
  });

  it('setDasRepeat sauvegarde dans localStorage', () => {
    input.setDasRepeat(40);
    expect(store['tetris-das-repeat']).toBe('40');
  });

  it('DAS delay est restauré depuis localStorage', () => {
    store['tetris-das-delay'] = '300';
    const fresh = new Input(game);
    expect(fresh.dasDelay).toBe(300);
  });

  it('DAS repeat est restauré depuis localStorage', () => {
    store['tetris-das-repeat'] = '80';
    const fresh = new Input(game);
    expect(fresh.dasRepeat).toBe(80);
  });

  it('DAS delay clamp une valeur hors-limites dans localStorage', () => {
    store['tetris-das-delay'] = '600';
    const fresh = new Input(game);
    expect(fresh.dasDelay).toBe(500);
  });

  it('DAS delay utilise le fallback si localStorage contient du texte', () => {
    store['tetris-das-delay'] = 'abc';
    const fresh = new Input(game);
    expect(fresh.dasDelay).toBe(170);
  });

  it('DAS repeat clamp une valeur négative dans localStorage', () => {
    store['tetris-das-repeat'] = '-50';
    const fresh = new Input(game);
    expect(fresh.dasRepeat).toBe(16);
  });

  it('_clearAll vide les keys et les DAS timers', () => {
    input.keys = { ArrowLeft: true, ArrowRight: true };
    input.dasTimers = {
      ArrowLeft: { timeout: setTimeout(() => {}, 9999), interval: setInterval(() => {}, 9999) },
    };
    input._clearAll();
    expect(input.keys).toEqual({});
    expect(input.dasTimers).toEqual({});
  });

  it('blur callback appelle _clearAll', () => {
    input.keys = { ArrowDown: true };
    expect(blurCallbacks.length).toBeGreaterThan(0);
    blurCallbacks[0](); // simule un blur
    expect(input.keys).toEqual({});
  });
});
