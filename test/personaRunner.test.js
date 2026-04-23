// PersonaRunner — tests avec un vrai Game, persona = objet JS direct.
// Pas de Worker, pas d'async : decide() est synchrone.

import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../src/game.js';
import { PersonaRunner } from '../src/versus/personaRunner.js';

function makeSide(game) { return { game, leadTime: 0 }; }

describe('PersonaRunner — fallback baseline (persona null)', () => {
  let game, oppGame, side, oppSide, runner;

  beforeEach(() => {
    game = new Game(); oppGame = new Game();
    game.start(); oppGame.start();
    side = makeSide(game); oppSide = makeSide(oppGame);
    runner = new PersonaRunner(null, side, () => oppSide);
  });

  it('inactif par défaut', () => {
    expect(runner.active).toBe(false);
    runner.update(100);
    expect(runner.moves.length).toBe(0);
  });

  it('planifie dès qu\'activé (persona null → baseline sync)', () => {
    runner.active = true;
    runner.update(100);
    expect(runner.moves.length).toBeGreaterThan(0);
  });

  it('exécute les moves progressivement selon speed', () => {
    runner.active = true;
    runner.setSpeed(80);
    runner.update(100);
    const initial = runner.moves.length;
    runner.update(200);
    expect(runner.moves.length).toBeLessThanOrEqual(initial);
  });

  it('drain complet : la pièce courante change après hardDrop', () => {
    runner.active = true;
    const pieceIdBefore = game.current.id;
    runner.setSpeed(0);
    let iterations = 0;
    while (runner.moves.length > 0 || iterations === 0) {
      runner.update(iterations * 10);
      iterations++;
      if (iterations > 20) break;
    }
    expect(game.current.id).not.toBe(pieceIdBefore);
  });

  it('setSpeed clamp à 20ms minimum', () => {
    runner.setSpeed(5);
    expect(runner.speed).toBe(20);
  });

  it('ne planifie pas si game over', () => {
    game.gameOver = true;
    runner.active = true;
    runner.update(100);
    expect(runner.moves.length).toBe(0);
  });

  it('ne planifie pas si pas démarré', () => {
    const g = new Game();
    const s = makeSide(g);
    const r = new PersonaRunner(null, s, () => oppSide);
    r.active = true;
    r.update(100);
    expect(r.moves.length).toBe(0);
  });
});

describe('PersonaRunner — avec persona', () => {
  let game, side;
  beforeEach(() => {
    game = new Game(); game.start();
    side = makeSide(game);
  });

  it('utilise persona.decide() si fournie (sync)', () => {
    const persona = {
      name: 'Test',
      banter: {},
      decide: () => ({ rotation: 0, x: 0 }),
    };
    const runner = new PersonaRunner(persona, side, () => side);
    runner.active = true;
    runner.update(0);
    expect(runner.moves.length).toBeGreaterThan(0);
  });

  it('fallback baseline si persona renvoie un résultat invalide', () => {
    const bad = { name: 'Bad', decide: () => ({ garbage: true }) };
    const runner = new PersonaRunner(bad, side, () => side);
    runner.active = true;
    runner.update(0);
    expect(runner.moves.length).toBeGreaterThan(0);
  });

  it('fallback baseline si decide jette', () => {
    const boom = { name: 'Boom', decide: () => { throw new Error('kaboom'); } };
    const runner = new PersonaRunner(boom, side, () => side);
    runner.active = true;
    runner.update(0);
    expect(runner.moves.length).toBeGreaterThan(0);
  });

  it('fallback si persona renvoie x infini (pas de freeze)', () => {
    const evil = { name: 'Evil', decide: () => ({ rotation: 0, x: Infinity }) };
    const runner = new PersonaRunner(evil, side, () => side);
    runner.active = true;
    runner.update(0);
    expect(runner.moves.length).toBeGreaterThan(0);
  });

  it('fallback si persona renvoie x hors domaine', () => {
    const crazy = { name: 'Crazy', decide: () => ({ rotation: 0, x: 99999 }) };
    const runner = new PersonaRunner(crazy, side, () => side);
    runner.active = true;
    runner.update(0);
    expect(runner.moves.length).toBeGreaterThan(0);
  });

  it('fallback si persona renvoie rotation NaN', () => {
    const nanP = { name: 'NaN', decide: () => ({ rotation: NaN, x: 3 }) };
    const runner = new PersonaRunner(nanP, side, () => side);
    runner.active = true;
    runner.update(0);
    expect(runner.moves.length).toBeGreaterThan(0);
  });

  it('replanifie après un move invalide (dx trompé → ok=false)', () => {
    let callCount = 0;
    const persona = {
      name: 'Drift',
      decide: () => {
        callCount++;
        // Première décision : x=3 (possible). Si elle réussit pas, on retente.
        return { rotation: 0, x: 3 };
      },
    };
    const runner = new PersonaRunner(persona, side, () => side);
    runner.active = true;
    runner.setSpeed(0);
    runner.update(0);   // plan 1
    const firstCount = callCount;
    // Force un replan en vidant artificiellement moves + reset planForPieceId
    runner.moves = [];
    runner._planForPieceId = -1;
    runner.update(10);  // replan 2 pour la même pièce
    expect(callCount).toBeGreaterThan(firstCount);
  });
});
