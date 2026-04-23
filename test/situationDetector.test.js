import { describe, it, expect, beforeEach } from 'vitest';
import { SituationDetector } from '../src/versus/situationDetector.js';

// Helper : tick simplifié — on pousse un state et retourne les events.
function tick(det, t, scoreL, scoreR, opts = {}) {
  return det.update({
    scoreL, scoreR,
    gameOverL: false, gameOverR: false,
    matchEnded: opts.matchEnded || false,
    winner: opts.winner,
  }, t);
}

describe('SituationDetector — MATCH_START', () => {
  it('émet MATCH_START au premier update', () => {
    const d = new SituationDetector();
    const ev = tick(d, 0, 0, 0);
    expect(ev.some(e => e.type === 'MATCH_START')).toBe(true);
  });
  it('ne ré-émet pas MATCH_START sur les updates suivants', () => {
    const d = new SituationDetector();
    tick(d, 0, 0, 0);
    const ev = tick(d, 100, 0, 0);
    expect(ev.some(e => e.type === 'MATCH_START')).toBe(false);
  });
});

describe('SituationDetector — TAKE_LEAD / LOSE_LEAD', () => {
  it('premier leader → TAKE_LEAD (pas de LOSE_LEAD, personne avant)', () => {
    const d = new SituationDetector();
    tick(d, 0, 0, 0);
    const ev = tick(d, 100, 1000, 0);
    const types = ev.map(e => e.type);
    expect(types).toContain('TAKE_LEAD');
    expect(ev.find(e => e.type === 'TAKE_LEAD').side).toBe('left');
    expect(types).not.toContain('LOSE_LEAD');
  });

  it('changement de leader → TAKE_LEAD pour le nouveau, LOSE_LEAD pour l\'ancien', () => {
    const d = new SituationDetector();
    tick(d, 0, 0, 0);
    tick(d, 100, 1000, 0);   // left takes lead
    const ev = tick(d, 200, 1000, 2000); // right takes lead
    expect(ev.find(e => e.type === 'TAKE_LEAD')?.side).toBe('right');
    expect(ev.find(e => e.type === 'LOSE_LEAD')?.side).toBe('left');
  });

  it('seuil anti-flip : différence < LEAD_MIN_DIFF ne déclenche pas de changement', () => {
    const d = new SituationDetector();
    tick(d, 0, 0, 0);
    tick(d, 100, 1000, 0); // left leader
    // Petit flip score dans le bruit (< 200 points)
    const ev = tick(d, 200, 1000, 1050);
    expect(ev.find(e => e.type === 'LOSE_LEAD')).toBeUndefined();
  });
});

describe('SituationDetector — DOMINATING / TRAILING', () => {
  it('émet DOMINATING après 30s de lead ininterrompu', () => {
    const d = new SituationDetector();
    tick(d, 0, 0, 0);
    tick(d, 100, 1000, 0);
    const ev = tick(d, 30_200, 1000, 0);
    const types = ev.map(e => e.type);
    expect(types).toContain('DOMINATING');
    expect(types).toContain('TRAILING');
    expect(ev.find(e => e.type === 'DOMINATING').side).toBe('left');
    expect(ev.find(e => e.type === 'TRAILING').side).toBe('right');
  });

  it('ne ré-émet pas DOMINATING sur les frames suivantes du même règne', () => {
    const d = new SituationDetector();
    tick(d, 0, 0, 0);
    tick(d, 100, 1000, 0);
    tick(d, 30_200, 1000, 0);
    const ev = tick(d, 35_000, 1000, 0);
    expect(ev.find(e => e.type === 'DOMINATING')).toBeUndefined();
  });

  it('un changement de leader remet à zéro le timer de dominating', () => {
    const d = new SituationDetector();
    tick(d, 0, 0, 0);
    tick(d, 100, 1000, 0);
    tick(d, 30_200, 1000, 0); // left dominating
    tick(d, 30_300, 1000, 2000); // right takes lead
    const ev = tick(d, 40_000, 1000, 2000); // 10s seulement pour right → pas de DOMINATING
    expect(ev.find(e => e.type === 'DOMINATING')).toBeUndefined();
  });
});

describe('SituationDetector — COMEBACK', () => {
  it('reprendre la tête après ≥ 20s de trail → COMEBACK', () => {
    const d = new SituationDetector();
    tick(d, 0, 0, 0);
    tick(d, 100, 1000, 0);       // left leads
    tick(d, 20_200, 1000, 3000); // right takes lead (left led for 20.1s)
    // 21s plus tard (right leader 21s) → left revient
    const ev = tick(d, 41_300, 5000, 3000);
    expect(ev.find(e => e.type === 'COMEBACK')?.side).toBe('left');
  });

  it('reprendre la tête après < 20s → PAS de COMEBACK', () => {
    const d = new SituationDetector();
    tick(d, 0, 0, 0);
    tick(d, 100, 1000, 0);
    tick(d, 10_000, 1000, 2000); // right takes lead (left led 9.9s)
    // Right lead 5s puis left revient
    const ev = tick(d, 15_000, 3000, 2000);
    expect(ev.find(e => e.type === 'COMEBACK')).toBeUndefined();
  });
});

describe('SituationDetector — CLOSE', () => {
  it('écart < 10% sur ≥ 15s avec scores non nuls → CLOSE', () => {
    const d = new SituationDetector();
    tick(d, 0, 0, 0);
    tick(d, 100, 1000, 950); // écart 5% (<10%), scores > 500
    // Tick à 14s : encore close mais pas encore ≥15s
    const ev14 = tick(d, 14_000, 1200, 1150);
    expect(ev14.find(e => e.type === 'CLOSE')).toBeUndefined();
    // Tick à 16s
    const ev16 = tick(d, 16_000, 1300, 1240);
    expect(ev16.find(e => e.type === 'CLOSE')).toBeDefined();
  });

  it('écart qui dépasse 10% reset le timer close', () => {
    const d = new SituationDetector();
    tick(d, 0, 0, 0);
    tick(d, 100, 1000, 950);
    tick(d, 10_000, 1500, 1000); // écart 33%
    const ev = tick(d, 16_000, 1500, 1450); // back to close, mais reset
    expect(ev.find(e => e.type === 'CLOSE')).toBeUndefined();
  });

  it('CLOSE pas émis si l\'un domine', () => {
    const d = new SituationDetector();
    tick(d, 0, 0, 0);
    tick(d, 100, 1000, 0);
    tick(d, 30_200, 1000, 0);     // left dominating
    const ev = tick(d, 50_000, 1000, 990); // rapprochement mais dominating toujours actif
    expect(ev.find(e => e.type === 'CLOSE')).toBeUndefined();
  });
});

describe('SituationDetector — fin de match VICTORY/DEFEAT', () => {
  it('winner=AI1 → VICTORY left, DEFEAT right', () => {
    const d = new SituationDetector();
    tick(d, 0, 0, 0);
    const ev = tick(d, 60_000, 5000, 3000, { matchEnded: true, winner: 'AI1' });
    expect(ev.find(e => e.type === 'VICTORY')?.side).toBe('left');
    expect(ev.find(e => e.type === 'DEFEAT')?.side).toBe('right');
  });

  it('winner=AI2 → VICTORY right, DEFEAT left', () => {
    const d = new SituationDetector();
    tick(d, 0, 0, 0);
    const ev = tick(d, 60_000, 3000, 5000, { matchEnded: true, winner: 'AI2' });
    expect(ev.find(e => e.type === 'VICTORY')?.side).toBe('right');
    expect(ev.find(e => e.type === 'DEFEAT')?.side).toBe('left');
  });

  it('winner=TIE → DEFEAT des deux côtés (pas de VICTORY)', () => {
    const d = new SituationDetector();
    tick(d, 0, 0, 0);
    const ev = tick(d, 60_000, 3000, 3000, { matchEnded: true, winner: 'TIE' });
    expect(ev.filter(e => e.type === 'DEFEAT')).toHaveLength(2);
    expect(ev.find(e => e.type === 'VICTORY')).toBeUndefined();
  });

  it('après matchEnded, plus aucun event émis', () => {
    const d = new SituationDetector();
    tick(d, 0, 0, 0);
    tick(d, 60_000, 5000, 3000, { matchEnded: true, winner: 'AI1' });
    const ev = tick(d, 70_000, 6000, 3000);
    expect(ev).toHaveLength(0);
  });
});

describe('SituationDetector — reset', () => {
  it('reset permet un nouveau match clean', () => {
    const d = new SituationDetector();
    tick(d, 0, 0, 0);
    tick(d, 100, 1000, 0);
    tick(d, 30_200, 1000, 0);
    d.reset();
    const ev = tick(d, 0, 0, 0);
    expect(ev.find(e => e.type === 'MATCH_START')).toBeDefined();
  });
});
