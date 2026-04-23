// Menu pré-match : liste les personas disponibles, laisse choisir AI1/AI2,
// persiste le dernier duel dans localStorage. Pas de framework.
//
// `personas` = { './personas/codex.js': { persona: {...} } } tel que fourni
// par import.meta.glob('./personas/*.js', { eager: true }).

const STORAGE_KEY = 'tetris-versus-duel';

export function filenameToDisplayName(path) {
  const base = path.replace(/^.*\/(.+?)\.js$/, '$1');
  return base
    .replace(/^_+/, '')
    .split(/[-_]/)
    .map(seg => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join(' ');
}

export function filenameToKey(path) {
  return path.replace(/^.*\/(.+?)\.js$/, '$1');
}

export class PersonaMenu {
  constructor({ root, personas, onStart }) {
    this.root = root;
    this.personas = personas;
    this.onStart = onStart;
    this.selected = { left: null, right: null };
    this._restoreLastDuel();
    this._buildDom();
  }

  _restoreLastDuel() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const { left, right } = JSON.parse(raw);
      const keys = new Set(Object.keys(this.personas).map(filenameToKey));
      if (left && keys.has(left)) this.selected.left = left;
      if (right && keys.has(right)) this.selected.right = right;
    } catch { /* noop */ }
  }

  _saveDuel() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.selected)); }
    catch { /* noop */ }
  }

  _buildDom() {
    this.root.classList.add('persona-menu');
    this.root.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'pm-title';
    title.textContent = 'Choisis ton duel';
    this.root.appendChild(title);

    const cols = document.createElement('div');
    cols.className = 'pm-cols';
    cols.appendChild(this._buildColumn('left', 'AI 1', '#00eaff'));
    cols.appendChild(this._buildColumn('right', 'AI 2', '#ff2d95'));
    this.root.appendChild(cols);

    const startRow = document.createElement('div');
    startRow.className = 'pm-startrow';
    const startBtn = document.createElement('button');
    startBtn.className = 'pm-start';
    startBtn.type = 'button';
    startBtn.textContent = 'FIGHT';
    startBtn.disabled = true;
    startBtn.addEventListener('click', () => this._emitStart());
    startRow.appendChild(startBtn);
    this.root.appendChild(startRow);
    this._startBtn = startBtn;
    this._updateStartState();
  }

  _buildColumn(side, label, accent) {
    const col = document.createElement('div');
    col.className = 'pm-col';
    col.style.setProperty('--pm-accent', accent);

    const head = document.createElement('div');
    head.className = 'pm-col-head';
    head.textContent = label;
    col.appendChild(head);

    const list = document.createElement('ul');
    list.className = 'pm-list';
    for (const path of Object.keys(this.personas).sort()) {
      const key = filenameToKey(path);
      // Priorité à persona.name (identifiant exact du modèle) ; fallback sur
      // le nom du fichier si la persona n'exporte pas name.
      const mod = this.personas[path];
      const display = mod?.persona?.name || filenameToDisplayName(path);
      const item = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pm-item';
      btn.dataset.key = key;
      btn.textContent = display;
      btn.addEventListener('click', () => this._select(side, key));
      item.appendChild(btn);
      list.appendChild(item);
    }
    col.appendChild(list);
    this._refreshColumn(col, side);
    col._side = side;
    return col;
  }

  _refreshColumn(col, side) {
    const sel = this.selected[side];
    for (const btn of col.querySelectorAll('.pm-item')) {
      btn.classList.toggle('selected', btn.dataset.key === sel);
    }
  }

  _select(side, key) {
    this.selected[side] = key;
    this._saveDuel();
    for (const col of this.root.querySelectorAll('.pm-col')) {
      this._refreshColumn(col, col._side);
    }
    this._updateStartState();
  }

  _updateStartState() {
    this._startBtn.disabled = !(this.selected.left && this.selected.right);
  }

  _emitStart() {
    const leftKey = this.selected.left;
    const rightKey = this.selected.right;
    if (!leftKey || !rightKey) return;

    const byKey = {};
    for (const path of Object.keys(this.personas)) byKey[filenameToKey(path)] = this.personas[path];

    this.onStart?.({
      left:  { key: leftKey,  module: byKey[leftKey],  displayName: this._displayFor(leftKey) },
      right: { key: rightKey, module: byKey[rightKey], displayName: this._displayFor(rightKey) },
    });
  }

  _displayFor(key) {
    for (const path of Object.keys(this.personas)) {
      if (filenameToKey(path) === key) {
        return this.personas[path]?.persona?.name || filenameToDisplayName(path);
      }
    }
    return key;
  }

  open() {
    this.root.classList.add('open');
    this.root.setAttribute('aria-hidden', 'false');
  }

  close() {
    this.root.classList.remove('open');
    this.root.setAttribute('aria-hidden', 'true');
  }
}
