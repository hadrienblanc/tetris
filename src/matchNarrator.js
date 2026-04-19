// MatchNarrator — observe l'état du match Versus et dispatch des événements
// narratifs au Commentator quand des conditions se réalisent :
//
// - LEAD_CHANGE : l'IA qui mène change
// - DOMINATION  : écart > seuil après 15s de match, annoncé une seule fois
// - COMEBACK    : l'IA dominée repasse en tête
// - CLOSE       : écart < 5% après 20s de match, annoncé quand on y rentre
// - DANGER      : la pile d'une IA atteint les 3 rangées du haut
// - TETRIS_STREAK : ≥ 2 Tetris consécutifs (sans rien d'autre entre) par une IA
//
// Le polling tourne à 500ms pour les événements liés au score (suffisant pour
// des scores qui montent par paliers) ; DANGER est aussi polllé dans la même
// boucle. Les événements liés à des actions discrètes (TETRIS_STREAK) sont
// déclenchés par les callbacks onAILinesCleared.

const POLL_MS = 500;
const DOMINATION_MIN_MATCH_MS = 15_000;
const CLOSE_MIN_MATCH_MS = 20_000;
const CLOSE_MIN_TOTAL_SCORE = 1_000;
const CLOSE_THRESHOLD = 0.05;      // < 5% du total
const CLOSE_RELEASE = 0.10;        // relâche la détection > 10%
const DOMINATION_BASE = 2_000;
const DOMINATION_RATIO = 0.4;
const DANGER_TOP_ROW = 3;          // bloc à row 0-2 = danger

export class MatchNarrator {
  constructor({ commentator, versus, clock } = {}) {
    this.commentator = commentator;
    this.versus = versus;
    this._clock = clock || (() => performance.now());
    this._state = this._freshState();
  }

  _freshState() {
    return {
      startTime: 0,
      lastPollTime: 0,
      lastLeadSign: 0,
      biggestLeadEver: 0,
      biggestLeader: null,
      dominationActive: false,
      closeActive: false,
      dangerActive: { left: false, right: false },
      tetrisStreak: { left: 0, right: 0 },
    };
  }

  matchStarted() {
    this._state = this._freshState();
    const now = this._clock();
    this._state.startTime = now;
    this._state.lastPollTime = now;
  }

  matchEnded() {
    // Pas besoin de disposition spécifique : les hooks gameOver + WINNER
    // passent déjà par le commentator.
  }

  // Appelé depuis les hooks versus en complément du dispatch direct TETRIS
  onAILinesCleared(count, side) {
    const other = side === 'left' ? 'right' : 'left';
    const s = this._state;
    if (count === 4) {
      s.tetrisStreak[side]++;
      s.tetrisStreak[other] = 0;
      if (s.tetrisStreak[side] >= 2) {
        this.commentator.dispatch('TETRIS_STREAK', { side });
      }
    } else {
      // toute autre ligne casse la série de Tetris du joueur qui l'a faite
      s.tetrisStreak[side] = 0;
    }
  }

  update(timestamp) {
    if (!this.versus || !this.versus.started) return;
    const s = this._state;
    if (timestamp - s.lastPollTime < POLL_MS) return;
    s.lastPollTime = timestamp;

    const l = this.versus.left.game;
    const r = this.versus.right.game;
    const diff = l.score - r.score;
    const absDiff = Math.abs(diff);
    const total = l.score + r.score;
    const matchTime = timestamp - s.startTime;
    const newSign = diff > 0 ? 1 : diff < 0 ? -1 : 0;

    // LEAD_CHANGE / COMEBACK
    if (newSign !== 0 && newSign !== s.lastLeadSign) {
      const leadingSide = newSign > 0 ? 'left' : 'right';
      if (s.lastLeadSign !== 0) {
        if (s.dominationActive && s.biggestLeader && s.biggestLeader !== leadingSide) {
          this.commentator.dispatch('COMEBACK', { side: leadingSide });
          s.dominationActive = false;
        } else {
          this.commentator.dispatch('LEAD_CHANGE', { side: leadingSide });
        }
      }
      s.lastLeadSign = newSign;
    }

    // Suivi du plus gros écart et de son leader
    if (absDiff > s.biggestLeadEver) {
      s.biggestLeadEver = absDiff;
      s.biggestLeader = diff > 0 ? 'left' : 'right';
    }

    // DOMINATION : écart > max(base, ratio * total) après un certain délai
    const domThreshold = Math.max(DOMINATION_BASE, total * DOMINATION_RATIO);
    if (!s.dominationActive
        && matchTime > DOMINATION_MIN_MATCH_MS
        && absDiff > domThreshold
        && !l.gameOver
        && !r.gameOver) {
      const side = diff > 0 ? 'left' : 'right';
      this.commentator.dispatch('DOMINATION', { side });
      s.dominationActive = true;
    } else if (s.dominationActive && absDiff < domThreshold * 0.5) {
      // relâche : permet un éventuel COMEBACK à l'avenir
      s.dominationActive = false;
    }

    // CLOSE : écart < 5% du total après 20s de match
    if (!s.closeActive
        && matchTime > CLOSE_MIN_MATCH_MS
        && total > CLOSE_MIN_TOTAL_SCORE
        && absDiff < total * CLOSE_THRESHOLD
        && !l.gameOver
        && !r.gameOver) {
      this.commentator.dispatch('CLOSE');
      s.closeActive = true;
    } else if (s.closeActive && total > 0 && absDiff > total * CLOSE_RELEASE) {
      s.closeActive = false;
    }

    // DANGER : pile qui atteint les 3 dernières rangées du haut
    for (const sideName of ['left', 'right']) {
      const g = this.versus[sideName].game;
      if (g.gameOver) { s.dangerActive[sideName] = false; continue; }
      const top = this._topBlockRow(g.board);
      const inDanger = top < DANGER_TOP_ROW;
      if (inDanger && !s.dangerActive[sideName]) {
        this.commentator.dispatch('DANGER', { side: sideName });
        s.dangerActive[sideName] = true;
      } else if (!inDanger && s.dangerActive[sideName]) {
        s.dangerActive[sideName] = false;
      }
    }
  }

  _topBlockRow(board) {
    for (let y = 0; y < board.length; y++) {
      const row = board[y];
      for (let x = 0; x < row.length; x++) if (row[x]) return y;
    }
    return board.length;
  }
}
