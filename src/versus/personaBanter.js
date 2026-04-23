// PersonaBanter — affiche une bulle de dialogue au-dessus de chaque board.
// Pioche dans persona.banter[type] selon le side reçu. Respecte un min-interval
// par côté pour ne pas saouler le spectateur.
//
// Utilisation : hooker sur situationDetector.update() → feed les events.

const MIN_INTERVAL_MS = 8_000; // 8s entre deux phrases du même côté
const DEFAULT_DURATION_MS = 4_000;

// Priorité : plus haut = plus prioritaire. Une phrase en cours peut être
// interrompue par un event de priorité strictement supérieure.
const PRIORITY = {
  VICTORY: 100,
  DEFEAT:   95,
  COMEBACK: 80,
  TAKE_LEAD: 60,
  DOMINATING: 50,
  LOSE_LEAD: 40,
  TRAILING: 35,
  CLOSE:    25,
  MATCH_START: 20,
};

function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export class PersonaBanter {
  // bubbles = { left: HTMLElement, right: HTMLElement }
  // personas = { left: {banter,...}, right: {banter,...} } — re-settable via setPersonas
  constructor({ bubbles, personas, clock } = {}) {
    this.bubbles = bubbles || { left: null, right: null };
    this.personas = personas || { left: null, right: null };
    this._clock = clock || (() => performance.now());
    this._state = {
      left:  { lastShownAt: 0, currentPriority: 0, hideAt: 0 },
      right: { lastShownAt: 0, currentPriority: 0, hideAt: 0 },
    };
  }

  setPersonas({ left, right }) {
    this.personas = { left, right };
  }

  reset() {
    this._state.left  = { lastShownAt: 0, currentPriority: 0, hideAt: 0 };
    this._state.right = { lastShownAt: 0, currentPriority: 0, hideAt: 0 };
    this._clearBubble('left');
    this._clearBubble('right');
  }

  // Consomme une liste d'events (typiquement issue de SituationDetector.update).
  ingest(events) {
    const now = this._clock();
    for (const ev of events) {
      // Events sans side (CLOSE, MATCH_START sans winner) : on alterne ou on
      // fait parler les deux selon le type. Pour MATCH_START → AI1 (left).
      // Pour CLOSE → on choisit le side avec le moins de phrases récentes.
      const side = ev.side || this._resolveSideForNeutral(ev.type);
      if (!side) continue;
      this._trySpeak(side, ev.type, now);
    }
    this._tickFade(now);
  }

  _resolveSideForNeutral(type) {
    if (type === 'MATCH_START') return 'left';
    // CLOSE : celui qui a parlé le plus récemment cède à l'autre
    const l = this._state.left.lastShownAt;
    const r = this._state.right.lastShownAt;
    return l <= r ? 'left' : 'right';
  }

  _trySpeak(side, type, now) {
    const persona = this.personas[side];
    if (!persona || !persona.banter) return;
    const lines = persona.banter[type];
    const text = pickRandom(lines);
    if (!text) return;

    const st = this._state[side];
    const prio = PRIORITY[type] ?? 10;

    // Respect du min-interval sauf si priorité strictement plus haute
    const tooSoon = now - st.lastShownAt < MIN_INTERVAL_MS;
    const canInterrupt = prio > st.currentPriority;
    if (tooSoon && !canInterrupt) return;

    this._showBubble(side, text);
    st.lastShownAt = now;
    st.currentPriority = prio;
    st.hideAt = now + DEFAULT_DURATION_MS;
  }

  _showBubble(side, text) {
    const bubble = this.bubbles[side];
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.add('visible');
  }

  _clearBubble(side) {
    const bubble = this.bubbles[side];
    if (!bubble) return;
    bubble.classList.remove('visible');
    bubble.textContent = '';
  }

  _tickFade(now) {
    for (const side of ['left', 'right']) {
      const st = this._state[side];
      if (st.hideAt > 0 && now >= st.hideAt) {
        this._clearBubble(side);
        st.currentPriority = 0;
        st.hideAt = 0;
      }
    }
  }
}
