// Commentator arcade pour le mode Versus.
// Reçoit des événements bruts (TETRIS, T_SPIN_2, KO, WINNER…), choisit une
// phrase aléatoire parmi une banque par type, gère une file avec priorité et
// pousse le résultat dans un élément DOM stylisé en CSS (gros texte arcade,
// scale-in + glow, scan lines).
//
// L'idée n'est pas de spammer chaque event : les priorités + le min-show-time
// garantissent qu'un événement fort (WINNER=10) interrompt immédiatement un
// événement faible (FIRST_BLOOD=6), mais que les events de même importance
// respectent leur créneau.

const AI1_COLOR = '#00eaff';
const AI2_COLOR = '#ff2d95';
const GOLD = '#ffd700';
const WHITE = '#ffffff';

const PHRASE_BANK = {
  MATCH_START: [
    'FIGHT !',
    "C'EST PARTI !",
    'QUE LE COMBAT COMMENCE !',
    "À L'ATTAQUE !",
    'ROUND 1 · FIGHT !',
  ],
  FIRST_BLOOD: [
    'PREMIER SANG · {AI} !',
    '{AI} FRAPPE EN PREMIER !',
    '{AI} OUVRE LE BAL !',
    '{AI} DONNE LE TEMPO !',
  ],
  TETRIS: [
    'TETRIS · {AI} !!',
    'QUADRUPLE DÉVASTATEUR !',
    "4 LIGNES D'UN COUP !",
    '{AI} · TETRIS !!',
    'BOUM · TETRIS !',
  ],
  T_SPIN_0: [
    'T-SPIN · {AI}',
    '{AI} pirouette',
  ],
  T_SPIN_1: [
    'T-SPIN SINGLE · {AI} !',
    'MANIPULATION !',
    '{AI} TOURNE LA PIÈCE !',
  ],
  T_SPIN_2: [
    'T-SPIN DOUBLE · {AI} !!',
    'TECHNIQUE MAÎTRISÉE !',
    'PUR ART · {AI} !',
    'DOUBLE EN ROTATION !',
  ],
  T_SPIN_3: [
    'T-SPIN TRIPLE · {AI} !!!',
    'INCROYABLE · {AI} !',
    'HORS-CATÉGORIE !',
    '{AI} TOUCHE À LA PERFECTION !',
  ],
  KO: [
    'KO · {AI} !',
    '{AI} À TERRE !',
    'GAME OVER POUR {AI} !',
    'LA BOÎTE DÉBORDE · {AI} !',
    '{AI} TOMBE !',
  ],
  WINNER: [
    '{AI} TRIOMPHE !',
    'VICTOIRE POUR {AI} !',
    "{AI} S'IMPOSE !",
    '{AI} REMPORTE LE MATCH !',
    'CHAMPION · {AI} !',
  ],
  TIE: [
    'ÉGALITÉ PARFAITE !',
    'MATCH NUL !',
    'À ÉGALITÉ · DRAW !',
  ],
};

const PRIORITY = {
  MATCH_START: 8,
  FIRST_BLOOD: 6,
  TETRIS: 8,
  T_SPIN_0: 4,
  T_SPIN_1: 6,
  T_SPIN_2: 8,
  T_SPIN_3: 9,
  KO: 10,
  WINNER: 10,
  TIE: 10,
};

const DURATION_MS = {
  MATCH_START: 1800,
  FIRST_BLOOD: 1600,
  TETRIS: 1800,
  T_SPIN_0: 1200,
  T_SPIN_1: 1500,
  T_SPIN_2: 1700,
  T_SPIN_3: 2100,
  KO: 2200,
  WINNER: 3000,
  TIE: 3000,
};

const MIN_SHOW_MS = 700;

function colorForSide(side) {
  if (side === 'left') return AI1_COLOR;
  if (side === 'right') return AI2_COLOR;
  return GOLD;
}

function aiLabel(side) {
  if (side === 'left') return 'AI 1';
  if (side === 'right') return 'AI 2';
  return '';
}

export class Commentator {
  constructor({ mainEl, clock } = {}) {
    this.mainEl = mainEl;
    this.current = null;
    this.queue = [];
    this._clock = clock || (() => performance.now());
  }

  reset() {
    this.current = null;
    this.queue.length = 0;
    if (this.mainEl) {
      this.mainEl.textContent = '';
      this.mainEl.classList.remove('vs-comm-anim');
    }
  }

  dispatch(type, data = {}) {
    const event = this._build(type, data);
    if (!event) return;
    const now = this._clock();
    if (this.current) {
      const elapsed = now - this.current.start;
      if (elapsed < MIN_SHOW_MS && event.priority <= this.current.priority) {
        this.queue.push(event);
        return;
      }
      if (event.priority < this.current.priority) {
        this.queue.push(event);
        return;
      }
    }
    this._show(event, now);
  }

  update(timestamp) {
    if (!this.current) {
      if (this.queue.length > 0) this._drainQueue(timestamp);
      return;
    }
    if (timestamp - this.current.start >= this.current.duration) {
      this.current = null;
      if (this.mainEl) {
        this.mainEl.textContent = '';
        this.mainEl.classList.remove('vs-comm-anim');
      }
      if (this.queue.length > 0) this._drainQueue(timestamp);
    }
  }

  _drainQueue(timestamp) {
    this.queue.sort((a, b) => b.priority - a.priority);
    const next = this.queue.shift();
    this._show(next, timestamp);
  }

  _show(event, now) {
    this.current = { ...event, start: now };
    this._render(this.current);
  }

  _render(event) {
    if (!this.mainEl) return;
    this.mainEl.textContent = event.phrase;
    this.mainEl.style.setProperty('--comm-color', event.color);
    this.mainEl.style.color = event.color;
    // Redémarre l'anim CSS en forçant un reflow
    this.mainEl.classList.remove('vs-comm-anim');
    void this.mainEl.offsetWidth;
    this.mainEl.style.setProperty('--comm-duration', `${event.duration}ms`);
    this.mainEl.classList.add('vs-comm-anim');
  }

  _build(type, data) {
    const phrases = PHRASE_BANK[type];
    if (!phrases || phrases.length === 0) return null;
    const raw = phrases[Math.floor(Math.random() * phrases.length)];
    const phrase = raw.replace(/\{AI\}/g, aiLabel(data.side));
    return {
      phrase,
      color: data.color || colorForSide(data.side),
      priority: PRIORITY[type] ?? 1,
      duration: DURATION_MS[type] ?? 1500,
      type,
    };
  }
}

export const PHRASE_TYPES = Object.keys(PHRASE_BANK);
