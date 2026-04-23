import { describe, it, expect, beforeEach } from 'vitest';
import { PersonaBanter } from '../src/versus/personaBanter.js';

function fakeBubble() {
  const classSet = new Set();
  return {
    _text: '',
    get textContent() { return this._text; },
    set textContent(v) { this._text = v; },
    classList: {
      add: (c) => classSet.add(c),
      remove: (c) => classSet.delete(c),
      contains: (c) => classSet.has(c),
    },
    visible() { return classSet.has('visible'); },
  };
}

function personaWithBanter(name, banter) {
  return { name, decide: () => ({ rotation: 0, x: 3 }), banter };
}

describe('PersonaBanter', () => {
  let bubbles, left, right;
  let now = 0;

  beforeEach(() => {
    now = 0;
    bubbles = { left: fakeBubble(), right: fakeBubble() };
    left  = personaWithBanter('L', {
      TAKE_LEAD: ['L TAKE'],
      DOMINATING: ['L DOM'],
      CLOSE: ['L CLOSE'],
    });
    right = personaWithBanter('R', {
      TAKE_LEAD: ['R TAKE'],
      DOMINATING: ['R DOM'],
    });
  });

  function mkBanter() {
    return new PersonaBanter({
      bubbles,
      personas: { left, right },
      clock: () => now,
    });
  }

  it('affiche la phrase du side ciblé pour un event avec side', () => {
    const b = mkBanter();
    b.ingest([{ type: 'TAKE_LEAD', side: 'left' }]);
    expect(bubbles.left.textContent).toBe('L TAKE');
    expect(bubbles.left.visible()).toBe(true);
    expect(bubbles.right.textContent).toBe('');
  });

  it('ne parle pas si banter[type] manquant pour cette persona', () => {
    const b = mkBanter();
    b.ingest([{ type: 'CLOSE', side: 'right' }]); // right n'a pas CLOSE
    expect(bubbles.right.visible()).toBe(false);
  });

  it('respecte le min-interval de 8s pour le même côté', () => {
    const b = mkBanter();
    b.ingest([{ type: 'TAKE_LEAD', side: 'left' }]);
    expect(bubbles.left.textContent).toBe('L TAKE');

    now += 2_000;
    bubbles.left.textContent = ''; // reset pour vérifier le silence
    b.ingest([{ type: 'TAKE_LEAD', side: 'left' }]);
    expect(bubbles.left.textContent).toBe(''); // trop tôt → silence
  });

  it('un event prioritaire peut interrompre avant les 8s', () => {
    const withVictory = personaWithBanter('L', { TAKE_LEAD: ['t'], VICTORY: ['win!'] });
    const b = new PersonaBanter({
      bubbles, personas: { left: withVictory, right }, clock: () => now,
    });
    b.ingest([{ type: 'TAKE_LEAD', side: 'left' }]);
    now += 1_000;
    b.ingest([{ type: 'VICTORY', side: 'left' }]);
    expect(bubbles.left.textContent).toBe('win!');
  });

  it('MATCH_START sans side va au côté gauche', () => {
    const withStart = personaWithBanter('L', { MATCH_START: ['go'] });
    const b = new PersonaBanter({
      bubbles, personas: { left: withStart, right }, clock: () => now,
    });
    b.ingest([{ type: 'MATCH_START', side: null }]);
    expect(bubbles.left.textContent).toBe('go');
  });

  it('CLOSE sans side va au côté qui a parlé le moins récemment', () => {
    const withClose = {
      left: personaWithBanter('L', { CLOSE: ['l-close'] }),
      right: personaWithBanter('R', { CLOSE: ['r-close'] }),
    };
    const b = new PersonaBanter({
      bubbles, personas: withClose, clock: () => now,
    });
    // left vient de parler
    b._state.left.lastShownAt = 1000;
    b._state.right.lastShownAt = 500;
    // CLOSE → doit aller à right (parlé plus anciennement)
    b.ingest([{ type: 'CLOSE', side: null }]);
    expect(bubbles.right.textContent).toBe('r-close');
    expect(bubbles.left.textContent).toBe('');
  });

  it('fade automatique après la durée par défaut', () => {
    const b = mkBanter();
    b.ingest([{ type: 'TAKE_LEAD', side: 'left' }]);
    expect(bubbles.left.visible()).toBe(true);
    now += 5_000;
    b.ingest([]);
    expect(bubbles.left.visible()).toBe(false);
  });

  it('reset() vide les bulles et remet les compteurs à zéro', () => {
    const b = mkBanter();
    b.ingest([{ type: 'TAKE_LEAD', side: 'left' }]);
    expect(bubbles.left.visible()).toBe(true);
    b.reset();
    expect(bubbles.left.visible()).toBe(false);
    // après reset, re-parler immédiatement est OK
    b.ingest([{ type: 'TAKE_LEAD', side: 'left' }]);
    expect(bubbles.left.visible()).toBe(true);
  });

  it('setPersonas permet de changer en cours de route', () => {
    const b = mkBanter();
    const newLeft = personaWithBanter('L2', { TAKE_LEAD: ['NEW L'] });
    b.setPersonas({ left: newLeft, right });
    b.ingest([{ type: 'TAKE_LEAD', side: 'left' }]);
    expect(bubbles.left.textContent).toBe('NEW L');
  });
});
