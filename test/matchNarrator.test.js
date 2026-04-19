import { describe, it, expect, beforeEach } from 'vitest';
import { MatchNarrator } from '../src/matchNarrator.js';

function makeBoard(filledRowY = null) {
  const board = [];
  for (let y = 0; y < 20; y++) {
    const row = [];
    for (let x = 0; x < 10; x++) {
      row.push(filledRowY !== null && y >= filledRowY ? 'I' : null);
    }
    board.push(row);
  }
  return board;
}

function makeMatch() {
  const leftGame = { score: 0, gameOver: false, board: makeBoard() };
  const rightGame = { score: 0, gameOver: false, board: makeBoard() };
  return {
    started: true,
    left: { game: leftGame },
    right: { game: rightGame },
  };
}

function makeCommentator() {
  const events = [];
  return {
    events,
    dispatch(type, data = {}) { events.push({ type, side: data.side }); },
  };
}

describe('MatchNarrator', () => {
  let versus;
  let commentator;
  let now;
  let narrator;

  beforeEach(() => {
    versus = makeMatch();
    commentator = makeCommentator();
    now = 0;
    narrator = new MatchNarrator({ commentator, versus, clock: () => now });
    narrator.matchStarted();
  });

  it('ne fait rien avant la première poll window', () => {
    versus.left.game.score = 500;
    narrator.update(100); // < 500ms
    expect(commentator.events).toHaveLength(0);
  });

  it('ne fire pas LEAD_CHANGE au tout premier lead', () => {
    versus.left.game.score = 500;
    now = 600;
    narrator.update(600);
    expect(commentator.events.filter(e => e.type === 'LEAD_CHANGE')).toHaveLength(0);
  });

  it('fire LEAD_CHANGE quand le signe s\'inverse', () => {
    versus.left.game.score = 500;
    now = 600; narrator.update(600);
    versus.left.game.score = 500;
    versus.right.game.score = 800;
    now = 1200; narrator.update(1200);
    const lc = commentator.events.filter(e => e.type === 'LEAD_CHANGE');
    expect(lc).toHaveLength(1);
    expect(lc[0].side).toBe('right');
  });

  it('DOMINATION fire après 15s avec gros écart', () => {
    versus.left.game.score = 10_000;
    versus.right.game.score = 1_000;
    now = 16_000;
    narrator.update(16_000);
    const dom = commentator.events.filter(e => e.type === 'DOMINATION');
    expect(dom).toHaveLength(1);
    expect(dom[0].side).toBe('left');
  });

  it('DOMINATION ne re-fire pas tant qu\'elle reste active', () => {
    versus.left.game.score = 10_000;
    versus.right.game.score = 1_000;
    now = 16_000; narrator.update(16_000);
    now = 17_000; narrator.update(17_000);
    now = 18_000; narrator.update(18_000);
    expect(commentator.events.filter(e => e.type === 'DOMINATION')).toHaveLength(1);
  });

  it('COMEBACK : IA dominée repasse en tête', () => {
    versus.left.game.score = 10_000;
    versus.right.game.score = 1_000;
    now = 16_000; narrator.update(16_000);
    // right comeback
    versus.right.game.score = 11_000;
    now = 17_000; narrator.update(17_000);
    const cb = commentator.events.filter(e => e.type === 'COMEBACK');
    expect(cb).toHaveLength(1);
    expect(cb[0].side).toBe('right');
  });

  it('CLOSE fire après 20s si écart très faible', () => {
    versus.left.game.score = 5_000;
    versus.right.game.score = 4_900;
    now = 21_000; narrator.update(21_000);
    expect(commentator.events.filter(e => e.type === 'CLOSE')).toHaveLength(1);
  });

  it('DANGER fire quand un bloc atteint le haut', () => {
    versus.left.game.board = makeBoard(2); // rangée 2 remplie
    now = 600; narrator.update(600);
    const dg = commentator.events.filter(e => e.type === 'DANGER');
    expect(dg).toHaveLength(1);
    expect(dg[0].side).toBe('left');
  });

  it('DANGER ne re-fire pas en continu', () => {
    versus.left.game.board = makeBoard(2);
    now = 600; narrator.update(600);
    now = 1200; narrator.update(1200);
    now = 1800; narrator.update(1800);
    expect(commentator.events.filter(e => e.type === 'DANGER')).toHaveLength(1);
  });

  it('TETRIS_STREAK après 2 tetris consécutifs', () => {
    narrator.onAILinesCleared(4, 'left');
    narrator.onAILinesCleared(4, 'left');
    expect(commentator.events.filter(e => e.type === 'TETRIS_STREAK')).toHaveLength(1);
  });

  it('TETRIS_STREAK cassée par une ligne non-tetris', () => {
    narrator.onAILinesCleared(4, 'left');
    narrator.onAILinesCleared(2, 'left'); // rupture
    narrator.onAILinesCleared(4, 'left');
    expect(commentator.events.filter(e => e.type === 'TETRIS_STREAK')).toHaveLength(0);
  });

  it('TETRIS_STREAK réinitialisée par un tetris adverse', () => {
    narrator.onAILinesCleared(4, 'left');
    narrator.onAILinesCleared(4, 'right');
    narrator.onAILinesCleared(4, 'left');
    expect(commentator.events.filter(e => e.type === 'TETRIS_STREAK')).toHaveLength(0);
  });

  it('matchStarted() réinitialise tout l\'état', () => {
    narrator.onAILinesCleared(4, 'left');
    narrator.onAILinesCleared(4, 'left');
    narrator.matchStarted();
    narrator.onAILinesCleared(4, 'left');
    // Seul le premier streak du premier match + le reset → pas de nouveau streak à 1 après reset
    expect(commentator.events.filter(e => e.type === 'TETRIS_STREAK')).toHaveLength(1);
  });

  it('ne dispatch rien si versus.started = false', () => {
    versus.started = false;
    versus.left.game.score = 10_000;
    now = 16_000;
    narrator.update(16_000);
    expect(commentator.events).toHaveLength(0);
  });
});
