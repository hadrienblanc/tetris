import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { filenameToDisplayName, filenameToKey, PersonaMenu } from '../src/versus/personaMenu.js';

// Mocks DOM légers — on simule juste ce qu'utilise PersonaMenu.
function mockEl(tag) {
  const classSet = new Set();
  const el = {
    tagName: tag.toUpperCase(),
    children: [],
    classList: {
      _set: classSet,
      add(...cls) { for (const c of cls) classSet.add(c); },
      remove(c) { classSet.delete(c); },
      toggle(c, on) { if (on) classSet.add(c); else classSet.delete(c); },
      contains(c) { return classSet.has(c); },
    },
    dataset: {},
    style: { setProperty: () => {} },
    innerHTML: '',
    textContent: '',
    disabled: false,
    type: '',
    attributes: {},
    listeners: {},
    appendChild(child) { this.children.push(child); child._parent = this; return child; },
    setAttribute(k, v) { this.attributes[k] = v; },
    addEventListener(evt, fn) { (this.listeners[evt] ||= []).push(fn); },
    click() { for (const fn of this.listeners.click || []) fn(); },
    querySelectorAll(sel) {
      const out = [];
      walk(this, (n) => { if (matches(n, sel)) out.push(n); });
      return out;
    },
    querySelector(sel) {
      let found = null;
      walk(this, (n) => { if (!found && matches(n, sel)) found = n; });
      return found;
    },
  };
  // className doit rester synchronisé avec classList pour que querySelector('.x') marche
  Object.defineProperty(el, 'className', {
    get() { return [...classSet].join(' '); },
    set(v) {
      classSet.clear();
      if (typeof v === 'string') {
        for (const c of v.split(/\s+/)) if (c) classSet.add(c);
      }
    },
  });
  return el;
}

function walk(node, fn) {
  fn(node);
  for (const c of node.children) walk(c, fn);
}

function matches(node, sel) {
  if (sel.startsWith('.')) return node.classList.contains(sel.slice(1));
  if (sel.startsWith('#')) return node.attributes?.id === sel.slice(1);
  return node.tagName?.toLowerCase() === sel.toLowerCase();
}

beforeEach(() => {
  globalThis.document = {
    createElement: (tag) => mockEl(tag),
  };
  globalThis.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] ?? null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
  };
});

afterEach(() => {
  delete globalThis.document;
  delete globalThis.localStorage;
});

// ────────────────────────────────────────────────────────────────────────────

describe('filenameToDisplayName / filenameToKey', () => {
  it('extrait le nom du fichier', () => {
    expect(filenameToKey('../personas/codex.js')).toBe('codex');
    expect(filenameToKey('/abs/personas/glm-5-1.js')).toBe('glm-5-1');
  });
  it('capitalise et remplace les tirets par des espaces', () => {
    expect(filenameToDisplayName('../personas/codex.js')).toBe('Codex');
    expect(filenameToDisplayName('../personas/glm-5-1.js')).toBe('Glm 5 1');
    expect(filenameToDisplayName('../personas/min-max.js')).toBe('Min Max');
  });
  it('strip les underscores de tête (baseline convention)', () => {
    expect(filenameToDisplayName('../personas/_baseline.js')).toBe('Baseline');
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe('PersonaMenu', () => {
  let root, personas;

  beforeEach(() => {
    root = mockEl('div');
    personas = {
      '../personas/_baseline.js': { persona: { name: 'Baseline', decide: () => ({ rotation: 0, x: 3 }) } },
      '../personas/codex.js':     { persona: { name: 'Codex',    decide: () => ({ rotation: 0, x: 3 }) } },
      '../personas/glm-5-1.js':   { persona: { name: 'GLM',      decide: () => ({ rotation: 0, x: 3 }) } },
    };
  });

  it('construit une colonne par côté avec un bouton par persona', () => {
    const menu = new PersonaMenu({ root, personas, onStart: () => {} });
    const cols = root.querySelectorAll('.pm-col');
    expect(cols.length).toBe(2);
    const items = root.querySelectorAll('.pm-item');
    expect(items.length).toBe(6); // 3 personas × 2 colonnes
  });

  it('le bouton start est disabled tant que la sélection est incomplète', () => {
    const menu = new PersonaMenu({ root, personas, onStart: () => {} });
    expect(menu._startBtn.disabled).toBe(true);
    menu._select('left', 'codex');
    expect(menu._startBtn.disabled).toBe(true);
    menu._select('right', 'glm-5-1');
    expect(menu._startBtn.disabled).toBe(false);
  });

  it('Start déclenche onStart avec les deux modules (clé, module, displayName)', () => {
    const onStart = vi.fn();
    const menu = new PersonaMenu({ root, personas, onStart });
    menu._select('left', 'codex');
    menu._select('right', '_baseline');
    menu._startBtn.click();

    expect(onStart).toHaveBeenCalledTimes(1);
    const arg = onStart.mock.calls[0][0];
    expect(arg.left.key).toBe('codex');
    expect(arg.left.module).toBe(personas['../personas/codex.js']);
    expect(arg.left.module.persona.name).toBe('Codex');
    expect(arg.left.displayName).toBe('Codex');
    expect(arg.right.key).toBe('_baseline');
    expect(arg.right.displayName).toBe('Baseline');
  });

  it('persiste la sélection dans localStorage', () => {
    const menu = new PersonaMenu({ root, personas, onStart: () => {} });
    menu._select('left', 'codex');
    const stored = JSON.parse(localStorage.getItem('tetris-versus-duel'));
    expect(stored.left).toBe('codex');
  });

  it('restore la dernière sélection depuis localStorage', () => {
    localStorage.setItem('tetris-versus-duel', JSON.stringify({ left: 'codex', right: '_baseline' }));
    const menu = new PersonaMenu({ root, personas, onStart: () => {} });
    expect(menu.selected.left).toBe('codex');
    expect(menu.selected.right).toBe('_baseline');
    expect(menu._startBtn.disabled).toBe(false);
  });

  it('ignore une sélection restaurée qui n\'existe plus', () => {
    localStorage.setItem('tetris-versus-duel', JSON.stringify({ left: 'disparue', right: 'codex' }));
    const menu = new PersonaMenu({ root, personas, onStart: () => {} });
    expect(menu.selected.left).toBe(null);
    expect(menu.selected.right).toBe('codex');
  });

  it('autorise AI1 = AI2 (démo baseline vs baseline)', () => {
    const onStart = vi.fn();
    const menu = new PersonaMenu({ root, personas, onStart });
    menu._select('left', '_baseline');
    menu._select('right', '_baseline');
    expect(menu._startBtn.disabled).toBe(false);
    menu._startBtn.click();
    const arg = onStart.mock.calls[0][0];
    expect(arg.left.key).toBe('_baseline');
    expect(arg.right.key).toBe('_baseline');
  });

  it('open() / close() togglent la classe et aria-hidden', () => {
    const menu = new PersonaMenu({ root, personas, onStart: () => {} });
    menu.open();
    expect(root.classList.contains('open')).toBe(true);
    expect(root.attributes['aria-hidden']).toBe('false');
    menu.close();
    expect(root.classList.contains('open')).toBe(false);
    expect(root.attributes['aria-hidden']).toBe('true');
  });
});
