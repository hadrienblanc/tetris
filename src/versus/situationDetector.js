// SituationDetector — observe (score, leadTime, gameOver) et émet les 8
// transitions utilisées par les banters de persona. Distinct du MatchNarrator
// central : ce détecteur sort des events typés par côté (left/right), le
// MatchNarrator agrège pour le commentator neutre.
//
// Events émis :
//   MATCH_START    (sans side)
//   TAKE_LEAD      (side)   — un côté vient de passer devant
//   LOSE_LEAD      (side)   — un côté vient de se faire doubler
//   DOMINATING     (side)   — un côté mène sans interruption depuis ≥ 30s
//   TRAILING       (side)   — un côté est derrière sans interruption ≥ 30s
//   CLOSE          (sans side) — écart < 10% et aucun dominating, ≥ 15s
//   COMEBACK       (side)   — reprend la tête après avoir traîné ≥ 20s
//   VICTORY/DEFEAT (side)   — fin de match (émis par endMatch)
//
// Conçu pour être tick-driven : appelle update({...}, timestamp) à chaque frame.
// Retourne les events nouvellement déclenchés pour cette frame (array, souvent vide).

const DOMINATING_MS = 30_000;
const TRAILING_MS = 30_000;
const CLOSE_MS = 15_000;
const CLOSE_RATIO = 0.10;
const CLOSE_MIN_SCORE = 500;
const COMEBACK_MIN_TRAIL_MS = 20_000;
const LEAD_MIN_DIFF = 200; // seuil anti-flip pour scores quasi-égaux

export class SituationDetector {
  constructor() {
    this.reset();
  }

  reset() {
    this._started = false;
    this._ended = false;
    this._leader = null;           // 'left' | 'right' | null
    this._leaderSince = 0;
    this._prevLeaderDuration = 0;  // durée du règne du leader précédent
    this._dominatingEmitted = null; // side pour lequel DOMINATING a été émis
    this._trailingEmitted = null;
    this._closeSince = 0;
    this._closeEmitted = false;
  }

  // state = { scoreL, scoreR, gameOverL, gameOverR, winner? }
  // timestamp = performance.now() au moment de l'appel
  // matchEnded = flag explicite ; quand true, on émet VICTORY/DEFEAT selon winner
  update(state, timestamp) {
    const events = [];

    if (!this._started) {
      this._started = true;
      this._leaderSince = timestamp;
      events.push({ type: 'MATCH_START', side: null, t: timestamp });
    }

    // Match terminé → events finaux une seule fois puis plus rien.
    if (state.matchEnded && !this._ended) {
      this._ended = true;
      if (state.winner === 'AI1') {
        events.push({ type: 'VICTORY', side: 'left',  t: timestamp });
        events.push({ type: 'DEFEAT',  side: 'right', t: timestamp });
      } else if (state.winner === 'AI2') {
        events.push({ type: 'VICTORY', side: 'right', t: timestamp });
        events.push({ type: 'DEFEAT',  side: 'left',  t: timestamp });
      } else {
        // TIE : chacun peut parler (DEFEAT neutre côté banter)
        events.push({ type: 'DEFEAT', side: 'left',  t: timestamp });
        events.push({ type: 'DEFEAT', side: 'right', t: timestamp });
      }
      return events;
    }
    if (this._ended) return events;

    // Détermine le leader (seuil anti-flip : différence minimale)
    const diff = state.scoreL - state.scoreR;
    let newLeader;
    if (diff > LEAD_MIN_DIFF) newLeader = 'left';
    else if (-diff > LEAD_MIN_DIFF) newLeader = 'right';
    else newLeader = this._leader; // égalité approx. → on garde l'ancien leader

    // Changement de leader → TAKE_LEAD + LOSE_LEAD (+ éventuel COMEBACK)
    if (newLeader !== this._leader) {
      const prevLeader = this._leader;
      const prevDuration = timestamp - this._leaderSince;
      this._leader = newLeader;
      this._leaderSince = timestamp;
      this._prevLeaderDuration = prevDuration;
      // reset flags DOMINATING/TRAILING (lead qui redémarre)
      this._dominatingEmitted = null;
      this._trailingEmitted = null;

      if (newLeader && prevLeader) {
        events.push({ type: 'TAKE_LEAD', side: newLeader,  t: timestamp });
        events.push({ type: 'LOSE_LEAD', side: prevLeader, t: timestamp });
        if (prevDuration >= COMEBACK_MIN_TRAIL_MS) {
          events.push({ type: 'COMEBACK', side: newLeader, t: timestamp });
        }
      } else if (newLeader && !prevLeader) {
        // Premier leader du match (souvent dès MATCH_START)
        events.push({ type: 'TAKE_LEAD', side: newLeader, t: timestamp });
      } else if (!newLeader && prevLeader) {
        // Retour à l'égalité : LOSE_LEAD pour l'ancien leader
        events.push({ type: 'LOSE_LEAD', side: prevLeader, t: timestamp });
      }
    }

    // DOMINATING : leader stable depuis ≥ 30s, émis une seule fois par règne
    if (this._leader && (timestamp - this._leaderSince) >= DOMINATING_MS) {
      if (this._dominatingEmitted !== this._leader) {
        this._dominatingEmitted = this._leader;
        events.push({ type: 'DOMINATING', side: this._leader, t: timestamp });
      }
      const trailing = this._leader === 'left' ? 'right' : 'left';
      if (this._trailingEmitted !== trailing && (timestamp - this._leaderSince) >= TRAILING_MS) {
        this._trailingEmitted = trailing;
        events.push({ type: 'TRAILING', side: trailing, t: timestamp });
      }
    }

    // CLOSE : scores proches, aucun dominating, ≥ 15s
    const maxScore = Math.max(state.scoreL, state.scoreR, 1);
    const closeNow = Math.abs(diff) / maxScore < CLOSE_RATIO
      && maxScore >= CLOSE_MIN_SCORE
      && this._dominatingEmitted === null;
    if (closeNow) {
      if (this._closeSince === 0) this._closeSince = timestamp;
      if (!this._closeEmitted && (timestamp - this._closeSince) >= CLOSE_MS) {
        this._closeEmitted = true;
        events.push({ type: 'CLOSE', side: null, t: timestamp });
      }
    } else {
      this._closeSince = 0;
      this._closeEmitted = false;
    }

    return events;
  }
}
