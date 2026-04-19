import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Commentator } from '../src/commentator.js';

function mockEl() {
  return {
    textContent: '',
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      contains(c) { return this._set.has(c); },
    },
    style: {
      _props: {},
      setProperty(k, v) { this._props[k] = v; },
      get color() { return this._props.color; },
      set color(v) { this._props.color = v; },
    },
    offsetWidth: 100,
  };
}

describe('Commentator', () => {
  let el;
  let c;
  let now;
  beforeEach(() => {
    el = mockEl();
    now = 0;
    c = new Commentator({ mainEl: el, clock: () => now });
  });

  it('affiche une phrase pour TETRIS', () => {
    c.dispatch('TETRIS', { side: 'left' });
    expect(el.textContent).toMatch(/TETRIS|QUADRUPLE|LIGNES|BOUM/);
    expect(el.style.color).toBe('#00eaff');
  });

  it('substitue {AI} par AI 1 / AI 2', () => {
    c.dispatch('KO', { side: 'right' });
    expect(el.textContent).toContain('AI 2');
    expect(el.style.color).toBe('#ff2d95');
  });

  it('TIE sans side colore en doré', () => {
    c.dispatch('TIE');
    expect(el.style.color).toBe('#ffd700');
  });

  it('event de priorité supérieure interrompt', () => {
    c.dispatch('FIRST_BLOOD', { side: 'left' }); // prio 6
    const before = el.textContent;
    // 1000ms plus tard, WINNER (prio 10) doit interrompre
    now = 1000;
    c.dispatch('WINNER', { side: 'left' });
    expect(el.textContent).not.toBe(before);
    expect(el.textContent).toMatch(/TRIOMPHE|VICTOIRE|IMPOSE|CHAMPION|REMPORTE/);
  });

  it('event de priorité inférieure est mis en queue', () => {
    c.dispatch('TETRIS', { side: 'left' }); // prio 8
    const tetrisPhrase = el.textContent;
    now = 100; // encore dans le min-show
    c.dispatch('FIRST_BLOOD', { side: 'right' }); // prio 6, queued
    expect(el.textContent).toBe(tetrisPhrase);
    // Après expiration du TETRIS (~1800ms), la queue est drainée
    now = 2000;
    c.update(2000);
    expect(el.textContent).toMatch(/PREMIER SANG|FRAPPE|OUVRE|TEMPO/);
  });

  it('reset() efface le texte et la queue', () => {
    c.dispatch('TETRIS', { side: 'left' });
    c.dispatch('FIRST_BLOOD', { side: 'right' });
    c.reset();
    expect(el.textContent).toBe('');
    expect(c.queue).toHaveLength(0);
    expect(c.current).toBeNull();
  });

  it('update fait expirer l\'event courant puis draine la queue', () => {
    c.dispatch('KO', { side: 'left' }); // prio 10, duration 2200
    const koPhrase = el.textContent;
    c.dispatch('TETRIS', { side: 'right' }); // queued (prio 8 < 10)
    now = 500;
    c.update(500);
    expect(el.textContent).toBe(koPhrase);
    // Après expiration
    now = 3000;
    c.update(3000);
    expect(el.textContent).toMatch(/TETRIS|QUADRUPLE|LIGNES|BOUM/);
  });

  it('dispatch de type inconnu est ignoré sans crash', () => {
    c.dispatch('NON_EXISTENT', { side: 'left' });
    expect(el.textContent).toBe('');
    expect(c.current).toBeNull();
  });

  it('events de même priorité : si min-show écoulé, le nouveau prend la place', () => {
    c.dispatch('TETRIS', { side: 'left' }); // prio 8
    const first = el.textContent;
    now = 800; // > min-show 700
    c.dispatch('MATCH_START'); // prio 8
    // Avec même priorité et min-show écoulé, l'event remplace
    expect(el.textContent).not.toBe(first);
  });
});
