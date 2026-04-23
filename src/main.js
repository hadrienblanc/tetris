import './style.css';
import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { ThemeManager } from './themeManager.js';
import { themes } from './themes.js';
import { AI } from './ai.js';
import { ParticleSystem } from './particles.js';
import { AmbientSystem } from './ambient.js';
import { TouchControls } from './touch.js';
import * as Sound from './sound.js';
import { VersusMode } from './versus.js';
import { VersusAmbient } from './versusAmbient.js';
import { Commentator } from './commentator.js';
import { MatchNarrator } from './matchNarrator.js';
import { PersonaMenu } from './versus/personaMenu.js';
import { PersonaBanter } from './versus/personaBanter.js';
import { SituationDetector } from './versus/situationDetector.js';

// Découverte automatique des personas : chaque module .js dans src/personas/
// qui exporte `persona` est disponible dans le menu.
const PERSONA_MODULES = import.meta.glob('./personas/*.js', { eager: true });

const CELL = 30;
// Mode actif, partagé entre wrappers d'input et boucle principale
let mode = 'solo';
const canvas = document.getElementById('board');
const preview = document.getElementById('preview');
const ctx = canvas.getContext('2d');
const isTouchDevice = 'ontouchstart' in window;
const announcer = document.getElementById('game-announcer');

function announce(text) {
  if (announcer) announcer.textContent = text;
}
const game = new Game({ marathonTarget: 0, difficulty: 'normal' });
const renderer = new Renderer(canvas, preview);
const input = new Input(game);
const themeManager = new ThemeManager(renderer);
const ai = new AI(game);
ai.active = true;
const particles = new ParticleSystem();
const ambient = new AmbientSystem();
ambient.resize(canvas.width, canvas.height);

// Ambient draw callback — défini une seule fois
renderer._ambientDraw = (ctx, theme) => ambient.draw(ctx, theme);

// Resize observer pour mettre à jour l'ambient quand le canvas est redimensionné en CSS
const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    if (width > 0 && height > 0) {
      ambient.resize(width, height);
    }
  }
});
resizeObserver.observe(canvas);

// Sons — callbacks sur le game
game.onLinesCleared = (rows, snapshots, count) => {
  Sound.playClear(count, game.difficulty);
  announce(`${count} ligne${count > 1 ? 's' : ''} effacée${count > 1 ? 's' : ''}`);
  for (let i = 0; i < rows.length; i++) {
    particles.emitRowFromSnapshot(rows[i], snapshots[i], CELL, renderer.theme);
  }
  if (count === 4) {
    addLabel('TETRIS !', '#00eaff', { big: true, duration: 90, shadow: '#00eaff' });
    particles.emitShockwave(canvas.width / 2, canvas.height / 2, '#00eaff', 220, 40);
    particles.emitShockwave(canvas.width / 2, canvas.height / 2, '#ffffff', 160, 30);
  } else if (count === 3) {
    addLabel('TRIPLE', '#ffd700', { big: true, duration: 75, shadow: '#ffd700' });
    particles.emitShockwave(canvas.width / 2, canvas.height / 2, '#ffd700', 180, 32);
  }
};
game.onLevelUp = (level) => { themeManager.setLevel(level); Sound.playLevelUp(game.difficulty); announce(`Niveau ${level}`); };
let lastLockCells = null;
game.onLock = (cells, pieceName) => {
  Sound.playLock(game.difficulty);
  lastLockCells = cells;
  const theme = renderer.theme;
  if (theme && cells?.length) {
    const color = theme.cells[pieceName] || '#fff';
    particles.emitLock(cells, CELL, color);
  }
};

// Feux d'artifice — timer IDs pour nettoyage
let victoryTimers = [];

function clearVictoryTimers() {
  victoryTimers.forEach(clearTimeout);
  victoryTimers = [];
}

// Cache leaderboard (mis à jour uniquement après victoire)
let cachedLeaderboard = game.getLeaderboard(game.difficulty);
function refreshLeaderboard() { cachedLeaderboard = game.getLeaderboard(game.difficulty); }

// Labels flottants
const floatingLabels = [];
let labelStackY = 0;
function addLabel(text, color, opts = {}) {
  const yBase = canvas.height / 2 - labelStackY;
  labelStackY += opts.big ? 46 : 22;
  floatingLabels.push({
    text,
    t: 0,
    duration: opts.duration || 60,
    yBase,
    color: color || '#fff',
    big: !!opts.big,
    shadow: opts.shadow || null,
  });
}

game.onTSpin = (lines) => {
  Sound.playTSpin(game.difficulty);
  const label = lines === 0 ? 'T-SPIN!' : `T-SPIN ${lines === 1 ? 'SINGLE' : lines === 2 ? 'DOUBLE' : 'TRIPLE'}!`;
  addLabel(label, '#ff00ff', { big: lines >= 2, shadow: '#ff00ff', duration: lines >= 2 ? 80 : 60 });
  // Burst T-spin : particules magenta + shockwave
  const spinColors = ['#ff00ff', '#cc00ff', '#fff'];
  particles.emitFirework(canvas.width / 2, canvas.height / 2 - 40, spinColors);
  particles.emitShockwave(canvas.width / 2, canvas.height / 2, '#ff00ff', 180, 32);
  if (lines >= 2) {
    particles.emitFirework(canvas.width / 2 - 40, canvas.height / 2, spinColors);
    particles.emitFirework(canvas.width / 2 + 40, canvas.height / 2, spinColors);
    particles.emitShockwave(canvas.width / 2, canvas.height / 2, '#ffffff', 120, 24);
  }
};
let lastMilestone = 0;
game.onScoreEarned = (points) => {
  if (points > 0) addLabel(`+${points}`, '#ffd700');
  // Milestones tous les 5 000 pts — grand label pour marquer le coup
  const milestone = Math.floor(game.score / 5000);
  if (milestone > lastMilestone) {
    lastMilestone = milestone;
    const value = milestone * 5000;
    addLabel(`${value.toLocaleString('fr-FR')} !`, '#ffd700', {
      big: true, shadow: '#ffaa00', duration: 80,
    });
    particles.emitShockwave(canvas.width / 2, canvas.height / 2, '#ffd700', 160, 28);
  }
};
game.onHardDrop = (lines) => {
  if (lines > 3) addLabel(`↓${lines}`, 'rgba(255,255,255,0.6)');
  // Poussière de slam proportionnelle à la distance (≥ 2 cases, sinon c'est juste un lock normal)
  if (lines >= 2 && lastLockCells) {
    particles.emitSlamDust(lastLockCells, CELL);
  }
};
game.onBackToBack = () => {
  Sound.playBackToBack(game.difficulty);
  const streak = game.b2bStreak;
  addLabel(streak >= 2 ? `BACK-TO-BACK ×${streak}!` : 'BACK-TO-BACK!', '#0ff');
};
game.onCombo = (n) => {
  Sound.playCombo(n, game.difficulty);
  addLabel(`COMBO ×${n}`, '#ffd700');
  // Burst combo : petites particules dorées au centre
  const comboColors = ['#ffd700', '#ffaa00', '#fff'];
  for (let i = 0; i < Math.min(n, 5); i++) {
    particles.emitFirework(
      canvas.width * 0.3 + Math.random() * canvas.width * 0.4,
      canvas.height * 0.3 + Math.random() * canvas.height * 0.2,
      comboColors,
    );
  }
};
game.onReset = () => { themeManager.setLevel(1); themeManager._levelMode = false; canvas.setAttribute('aria-label', 'Grille de jeu Tetris — en attente'); announce(''); clearVictoryTimers(); particles.particles.length = 0; particles.shockwaves.length = 0; lastMilestone = 0; renderer.resetCounters(); };
game.onStart = () => { canvas.setAttribute('aria-label', 'Grille de jeu Tetris — en cours'); announce('Partie commencée'); };
game.onPause = (paused) => { canvas.setAttribute('aria-label', `Grille de jeu Tetris — ${paused ? 'en pause' : 'en cours'}`); if (paused) announce('Pause'); };
game.onGameOver = () => {
  Sound.playGameOver(game.difficulty);
  floatingLabels.length = 0;
  canvas.setAttribute('aria-label', 'Grille de jeu Tetris — game over');
  announce(`Game over. Score : ${game.score}. ${game.stats.pieces} pièces, niveau ${game.level}`);
  // Explosion sombre
  particles.emitExplosion(canvas.width / 2, canvas.height / 2);
};
game.onVictory = () => {
  Sound.playVictory(game.difficulty);
  announce(`Victoire ! ${game.marathonTarget} lignes en ${game.stats.pieces} pièces !`);
  refreshLeaderboard();
  clearVictoryTimers();
  // Feux d'artifice
  const theme = renderer.theme;
  const fireworkColors = theme?.cells ? Object.values(theme.cells) : ['#ffd700', '#fff', '#ff69b4'];
  const w = canvas.width;
  const h = canvas.height;
  for (let i = 0; i < 6; i++) {
    const id = setTimeout(() => {
      if (game.marathonWon) {
        particles.emitFirework(
          40 + Math.random() * (w - 80),
          h * 0.3 + Math.random() * h * 0.3,
          fireworkColors,
        );
      }
    }, i * 300);
    victoryTimers.push(id);
  }
};

// Sons — intercepter les actions de l'input
const origHandleKey = input._handleKey.bind(input);
input._handleKey = (code) => {
  // En versus, le clavier ne pilote plus la partie solo (cachée)
  if (mode === 'versus') return;
  const prevScore = game.score;
  origHandleKey(code);
  if (game.gameOver) return;
  if (code === 'ArrowLeft' || code === 'ArrowRight') Sound.playMove(game.difficulty);
  else if (code === 'ArrowUp') { if (game.current) Sound.playRotate(game.difficulty); }
  else if (code === 'Space') Sound.playDrop(game.difficulty);
};

// Partager stats (clic sur bouton "Partager" dans l'overlay game over)
const SHARE_BTN = { w: 80, h: 28 };
const JSON_BTN = { w: 80, h: 28 };
SHARE_BTN.x = () => canvas.width / 2 - SHARE_BTN.w - 4;
JSON_BTN.x = () => canvas.width / 2 + 4;
const btnRow = () => canvas.height / 2 + 40;
SHARE_BTN.y = btnRow;
JSON_BTN.y = btnRow;
let shareFeedback = 0; // frames restantes pour afficher "Copié !"

function isInBtn(btn, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (clientX - rect.left) * scaleX;
  const y = (clientY - rect.top) * scaleY;
  return x >= btn.x() && x <= btn.x() + btn.w && y >= btn.y() && y <= btn.y() + btn.h;
}

function isShareHit(clientX, clientY) { return isInBtn(SHARE_BTN, clientX, clientY); }
function isJsonHit(clientX, clientY) { return isInBtn(JSON_BTN, clientX, clientY); }

// Contrôles tactile (passe isShareHit pour éviter le reset au tap sur Partager)
new TouchControls(game, canvas, { isShareHit: (x, y) => isShareHit(x, y) || isJsonHit(x, y) });

canvas.addEventListener('click', (e) => {
  if (!game.gameOver) return;
  if (isShareHit(e.clientX, e.clientY)) {
    const text = game.formatStats();
    navigator.clipboard.writeText(text).then(() => {
      shareFeedback = 90; // ~1.5s
    }).catch(() => {
      shareFeedback = -60; // erreur
    });
  }
  if (isJsonHit(e.clientX, e.clientY)) {
    const blob = new Blob([game.getStatsJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tetris-stats.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
});

// Toggle AI
const aiBtn = document.getElementById('ai-toggle');
aiBtn.classList.add('active');
aiBtn.addEventListener('click', () => {
  ai.toggle();
  aiBtn.textContent = ai.isActive() ? 'Mode : AI' : 'Mode : Manuel';
  aiBtn.classList.toggle('active', ai.isActive());
  aiBtn.setAttribute('aria-pressed', ai.isActive());
});

// Vitesse AI
const speedSlider = document.getElementById('ai-speed');
const speedLabel = document.getElementById('ai-speed-label');
const speedBar = document.getElementById('ai-speed-bar');

function updateSpeedBar(val) {
  if (!speedBar) return;
  // 20ms = vert (rapide) → 1000ms = rouge (lent)
  const t = (val - 20) / (1000 - 20);
  const r = Math.round(t * 255);
  const g = Math.round((1 - t) * 200);
  speedBar.style.background = `rgb(${r},${g},60)`;
  speedBar.style.width = `${(1 - t) * 100}%`;
}

if (speedSlider) {
  updateSpeedBar(parseInt(speedSlider.value));
  speedSlider.addEventListener('input', () => {
    const val = parseInt(speedSlider.value);
    ai.setSpeed(val);
    speedLabel.textContent = val + 'ms';
    updateSpeedBar(val);
  });
}

// Toggle son
const muteBtn = document.getElementById('mute-toggle');
if (muteBtn) {
  muteBtn.addEventListener('click', () => {
    const muted = Sound.toggleMute();
    muteBtn.textContent = muted ? 'Son : Off' : 'Son : On';
    muteBtn.classList.toggle('muted', muted);
    muteBtn.setAttribute('aria-pressed', muted);
  });
}

// Difficulté (fixée à normal)

// Thèmes auto-cycle uniquement
const themeProgressBar = document.getElementById('theme-progress-bar');
let _lastThemeColor = '';

// DAS configurable
const dasDelaySlider = document.getElementById('das-delay');
const dasDelayLabel = document.getElementById('das-delay-label');
const dasRepeatSlider = document.getElementById('das-repeat');
const dasRepeatLabel = document.getElementById('das-repeat-label');
if (dasDelaySlider) {
  // Sync depuis Input (peut avoir chargé depuis localStorage)
  dasDelaySlider.value = input.dasDelay;
  dasDelayLabel.textContent = input.dasDelay + 'ms';
  dasDelaySlider.addEventListener('input', () => {
    input.setDasDelay(parseInt(dasDelaySlider.value));
    dasDelayLabel.textContent = input.dasDelay + 'ms';
  });
}
if (dasRepeatSlider) {
  dasRepeatSlider.value = input.dasRepeat;
  dasRepeatLabel.textContent = input.dasRepeat + 'ms';
  dasRepeatSlider.addEventListener('input', () => {
    input.setDasRepeat(parseInt(dasRepeatSlider.value));
    dasRepeatLabel.textContent = input.dasRepeat + 'ms';
  });
}

// === Versus mode ===
const versusApp = document.getElementById('versus-app');
const versusControls = document.getElementById('versus-controls');
const soloApp = document.getElementById('app');
const modeSolo = document.getElementById('mode-solo');
const modeVersus = document.getElementById('mode-versus');

const VS_GAUGE_W = 200;
const VS_GAUGE_MIN_H = 600;

const versus = new VersusMode({
  leftCanvas: document.getElementById('board-left'),
  leftPreview: document.getElementById('preview-left'),
  rightCanvas: document.getElementById('board-right'),
  rightPreview: document.getElementById('preview-right'),
  gaugeCanvas: document.getElementById('vs-gauge'),
});
versus.gauge.resize(VS_GAUGE_W, VS_GAUGE_MIN_H);

// Le canvas a une largeur fixe (200 px) mais sa hauteur suit celle de la colonne
// centrale (étirée à 100vh par le CSS flex stretch). Un ResizeObserver maintient
// le buffer aligné avec la hauteur CSS pour un rendu net, pas étiré.
const vsCenterEl = document.querySelector('.vs-center');
const gaugeResizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const h = Math.max(VS_GAUGE_MIN_H, Math.floor(entry.contentRect.height));
    if (h > 0 && versus.gauge.canvas.height !== h) {
      versus.gauge.resize(VS_GAUGE_W, h);
    }
  }
});
gaugeResizeObserver.observe(vsCenterEl);

// Compteurs LEAD arcade : chaque seconde entière de lead cumulée déclenche
// un pop façon Street Fighter sur le côté du meneur. On garde le dernier
// entier par côté pour détecter les franchissements et on force le reflow
// avant re-ajout de la classe 'pop' pour rejouer l'anim.
const leadCounters = {
  p1: {
    root: document.getElementById('vs-lead-p1'),
    num: document.querySelector('#vs-lead-p1 .vs-lead-num'),
    lastSec: 0,
  },
  p2: {
    root: document.getElementById('vs-lead-p2'),
    num: document.querySelector('#vs-lead-p2 .vs-lead-num'),
    lastSec: 0,
  },
};

function updateLeadCounters() {
  // Compteur = streak consécutif (pas le cumul), pour montrer la montée en
  // puissance ininterrompue. Le cumul reste sur la jauge. Streaks s'excluent :
  // quand l'une > 0, l'autre est à 0 (reset au changement de meneur).
  const stL = Math.floor(versus.streakLeft / 1000);
  const stR = Math.floor(versus.streakRight / 1000);
  // Seuil 1s : évite d'afficher "0" au réveil du streak (court blackout dramatique
  // entre le reset et la première seconde entière).
  const leadingP1 = stL > 0;
  const leadingP2 = stR > 0;
  leadCounters.p1.root.classList.toggle('active', leadingP1);
  leadCounters.p2.root.classList.toggle('active', leadingP2);
  applyTier(leadCounters.p1.root, leadingP1 ? stL : 0);
  applyTier(leadCounters.p2.root, leadingP2 ? stR : 0);
  bumpCounter(leadCounters.p1, stL, leadingP1);
  bumpCounter(leadCounters.p2, stR, leadingP2);
}

// Paliers visuels : 10s+ → feu (halo orange qui flicker), 30s+ → explosion
// (multicolor chaud + shake). En-dessous, apparence normale.
function applyTier(root, streakSec) {
  const fire = streakSec >= 10 && streakSec < 30;
  const blaze = streakSec >= 30;
  root.classList.toggle('tier-fire', fire);
  root.classList.toggle('tier-blaze', blaze);
}

function bumpCounter(counter, sec, isWinning) {
  if (sec === counter.lastSec) return;
  const txt = String(sec);
  counter.num.textContent = txt;
  // data-num alimente les pseudo-éléments ::before/::after qui font les ghosts.
  counter.num.setAttribute('data-num', txt);
  counter.lastSec = sec;
  // Pop seulement si c'est le meneur qui vient d'ajouter une seconde ;
  // sinon on met juste à jour silencieusement (pas de pop à la reprise après KO).
  if (!isWinning) return;
  counter.root.classList.remove('pop');
  // Force reflow pour relancer l'animation CSS même si la classe est déjà présente.
  void counter.root.offsetWidth;
  counter.root.classList.add('pop');
}

function resetLeadCounters() {
  for (const c of [leadCounters.p1, leadCounters.p2]) {
    c.lastSec = 0;
    c.num.textContent = '0';
    c.num.setAttribute('data-num', '0');
    c.root.classList.remove('pop', 'active', 'tier-fire', 'tier-blaze');
  }
}

const ambientCanvas = document.getElementById('vs-ambient');
const ambientLabel = document.getElementById('vs-ambient-label');
const versusAmbient = new VersusAmbient(ambientCanvas);
versusAmbient.onLabelChange = (name) => { if (ambientLabel) ambientLabel.textContent = name; };

// Chaque level-up d'une IA déclenche un pulse plein écran sur le BG
// et force le passage à la scène suivante (mini-film qui change à chaque palier).
versus.onAILevelUp = (color, level) => {
  const intensity = Math.min(1.7, 0.7 + level * 0.15);
  versusAmbient.pulse(color, intensity);
  versusAmbient.forceNextIfReady();
};

// Commentator arcade (phase A)
const commentatorRoot = document.getElementById('vs-commentator');
const commentator = new Commentator({
  mainEl: commentatorRoot.querySelector('.vs-comm-main'),
});
const narrator = new MatchNarrator({ commentator, versus });
let firstBloodFired = false;

versus.onMatchStart = () => {
  firstBloodFired = false;
  commentator.reset();
  narrator.matchStarted();
  commentator.dispatch('MATCH_START');
};
versus.onAILinesCleared = (count, side) => {
  if (!firstBloodFired) {
    firstBloodFired = true;
    commentator.dispatch('FIRST_BLOOD', { side });
  }
  if (count === 4) commentator.dispatch('TETRIS', { side });
  narrator.onAILinesCleared(count, side);
};
versus.onAITSpin = (lines, side) => {
  // T-spin sans ligne : déjà bruyant visuellement via l'onde de choc, on
  // n'encombre pas le commentator avec une annonce.
  if (lines <= 0) return;
  commentator.dispatch(`T_SPIN_${Math.min(3, lines)}`, { side });
};
versus.onAIGameOver = (side) => {
  commentator.dispatch('KO', { side });
};
versus.onMatchEnd = (winner) => {
  if (winner === 'TIE') commentator.dispatch('TIE');
  else commentator.dispatch('WINNER', { side: winner === 'AI1' ? 'left' : 'right' });
  // Laisse respirer le banner WINNER / le commentator avant de rejouer l'overlay.
  overlayHideUntil = performance.now() + OVERLAY_POSTMATCH_DELAY;
};

function resizeVersusAmbient() {
  versusAmbient.resize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', () => { if (mode === 'versus') resizeVersusAmbient(); });

document.getElementById('vs-ambient-next').addEventListener('click', () => versusAmbient.next());

let soloPausedByVersus = false;
let lastVersusTheme = null;

function setMode(next) {
  if (next === mode) return;
  mode = next;
  const isSolo = mode === 'solo';
  soloApp.style.display = isSolo ? '' : 'none';
  versusApp.style.display = isSolo ? 'none' : '';
  versusApp.setAttribute('aria-hidden', String(isSolo));
  versusControls.style.display = isSolo ? 'none' : '';
  versusControls.setAttribute('aria-hidden', String(isSolo));
  modeSolo.classList.toggle('active', isSolo);
  modeSolo.setAttribute('aria-selected', String(isSolo));
  modeVersus.classList.toggle('active', !isSolo);
  modeVersus.setAttribute('aria-selected', String(!isSolo));

  if (isSolo) {
    versus.reset();
    resetLeadCounters();
    banter.reset();
    situation.reset();
    versusAmbient.stop();
    ambientCanvas.style.display = 'none';
    commentatorRoot.style.display = 'none';
    commentator.reset();
    if (soloPausedByVersus && game.paused && game.started && !game.gameOver && !game.marathonWon) {
      game.togglePause();
    }
    soloPausedByVersus = false;
  } else {
    if (!game.paused && game.started && !game.gameOver && !game.marathonWon) {
      game.togglePause();
      soloPausedByVersus = true;
    }
    versus.setTheme(renderer.theme);
    lastVersusTheme = renderer.theme;
    versus.reset();
    resetLeadCounters();
    ambientCanvas.style.display = 'block';
    commentatorRoot.style.display = '';
    commentator.reset();
    resizeVersusAmbient();
    versusAmbient.start();
    openPersonaMenu();
  }
}

modeSolo.addEventListener('click', () => setMode('solo'));
modeVersus.addEventListener('click', () => setMode('versus'));

function tryStartVersus() {
  if (versus.bothOver) {
    versus.reset();
    resetLeadCounters();
    // Situation/banter doivent aussi être remis à zéro : sinon après une
    // première manche, detector._ended=true bloque toute émission future.
    situation.reset();
    banter.reset();
  }
  if (!versus.started) versus.start();
}

// ═══ Menu de sélection des personas + banter ═════════════════════════════
const personaMenuRoot = document.getElementById('vs-persona-menu');
let personaMenu = null;

const banter = new PersonaBanter({
  bubbles: {
    left:  document.getElementById('vs-banter-left'),
    right: document.getElementById('vs-banter-right'),
  },
});
const situation = new SituationDetector();

function startDuel({ left, right }) {
  const lPersona = left.module?.persona || null;
  const rPersona = right.module?.persona || null;
  versus.setPersonas(lPersona, rPersona);
  banter.setPersonas({ left: lPersona, right: rPersona });
  // Tags joueur : affiche le nom de la persona
  const tagL = document.getElementById('vs-tag-left');
  const tagR = document.getElementById('vs-tag-right');
  if (tagL) tagL.textContent = lPersona?.name || 'AI 1';
  if (tagR) tagR.textContent = rPersona?.name || 'AI 2';
  situation.reset();
  banter.reset();
  personaMenu.close();
  versus.reset();
  resetLeadCounters();
  versus.start();
}

function openPersonaMenu() {
  if (!personaMenu) {
    personaMenu = new PersonaMenu({
      root: personaMenuRoot,
      personas: PERSONA_MODULES,
      onStart: startDuel,
    });
  }
  personaMenu.open();
}

document.getElementById('vs-start').addEventListener('click', tryStartVersus);

// Overlay central : bouton XXL d'invite quand la manche n'a pas (ou plus) lieu.
// Après un match, on attend OVERLAY_POSTMATCH_DELAY avant de le réafficher
// pour laisser le banner WINNER de la jauge respirer.
const startOverlay = document.getElementById('vs-start-overlay');
startOverlay.addEventListener('click', tryStartVersus);
const OVERLAY_POSTMATCH_DELAY = 2200;
let overlayHideUntil = 0;
let lastOverlayShown = null;
function updateStartOverlay(timestamp) {
  const ended = versus.bothOver;
  const show = (!versus.started || ended) && timestamp >= overlayHideUntil;
  if (show === lastOverlayShown) return;
  lastOverlayShown = show;
  startOverlay.hidden = !show;
}
document.getElementById('vs-reset').addEventListener('click', () => {
  versus.reset();
  resetLeadCounters();
  // NEW MATCH réouvre le menu pour choisir un nouveau duel
  openPersonaMenu();
});
const vsSpeed = document.getElementById('vs-speed');
const vsSpeedLabel = document.getElementById('vs-speed-label');
vsSpeed.addEventListener('input', () => {
  const ms = parseInt(vsSpeed.value);
  versus.setAISpeed(ms);
  vsSpeedLabel.textContent = ms + 'ms';
});

function loop(timestamp) {
  if (mode === 'versus') {
    // Détecteur de situation → bulles banter. Pas besoin de tourner si la
    // manche n'a pas démarré (mais versus.started reste true jusqu'au reset).
    if (versus.started) {
      const events = situation.update({
        scoreL: versus.left.game.score,
        scoreR: versus.right.game.score,
        gameOverL: versus.left.game.gameOver,
        gameOverR: versus.right.game.gameOver,
        matchEnded: !!versus._winner,
        winner: versus._winner,
      }, timestamp);
      if (events.length > 0) banter.ingest(events);
      else banter.ingest([]); // tick vide pour le fade
    }

    themeManager.update(timestamp);
    if (renderer.theme !== lastVersusTheme) {
      versus.setTheme(renderer.theme);
      lastVersusTheme = renderer.theme;
    }
    versusAmbient.update(timestamp);
    versus.update(timestamp);
    versus.draw(timestamp);
    updateLeadCounters();
    updateStartOverlay(timestamp);
    narrator.update(timestamp);
    commentator.update(timestamp);
    requestAnimationFrame(loop);
    return;
  }

  if (!game.paused && !game.gameOver && !game.marathonWon && game.started && game.clearingRows.length === 0) ai.update(timestamp);
  game.update(timestamp);
  if (!game.paused) themeManager.update(timestamp);

  // Ambient effects — toujours actifs (cosmétique)
  const currentTheme = renderer.theme;
  ambient.setTheme(currentTheme);
  ambient.update(currentTheme);

  renderer.draw(game);

  if (!game.paused && !game.gameOver) {
    particles.update();
    particles.draw(ctx);
  }

  // Labels flottants — scale-bounce à l'apparition puis fade+scroll up
  for (let i = floatingLabels.length - 1; i >= 0; i--) {
    const label = floatingLabels[i];
    label.t++;
    const progress = label.t / label.duration;
    if (progress >= 1) { floatingLabels.splice(i, 1); continue; }
    // bounce : 0→0.15 scale 0.3→1.3, 0.15→0.3 scale 1.3→1.0, ensuite 1.0
    let scale;
    if (progress < 0.15) scale = 0.3 + (progress / 0.15) * 1.0;
    else if (progress < 0.30) scale = 1.3 - ((progress - 0.15) / 0.15) * 0.3;
    else scale = 1.0;
    const alpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3;
    const yOff = -progress * (label.big ? 30 : 40);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(canvas.width / 2, label.yBase + yOff);
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';
    ctx.fillStyle = label.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = label.big ? 5 : 3;
    ctx.font = label.big ? 'bold 40px monospace' : 'bold 18px monospace';
    if (label.shadow) {
      ctx.shadowColor = label.shadow;
      ctx.shadowBlur = label.big ? 24 : 10;
    }
    ctx.strokeText(label.text, 0, 0);
    ctx.fillText(label.text, 0, 0);
    ctx.restore();
  }
  // Reset stack quand tous les labels sont partis
  if (floatingLabels.length === 0) labelStackY = 0;

  // Vignette d'alerte quand la pile approche du haut (4 dernières rangées)
  if (game.started && !game.gameOver && !game.marathonWon && !game.paused) {
    let topBlockRow = 20;
    for (let y = 0; y < 20; y++) {
      const row = game.board[y];
      for (let x = 0; x < row.length; x++) {
        if (row[x]) { topBlockRow = y; y = 20; break; }
      }
    }
    const dangerRows = 4;
    if (topBlockRow < dangerRows) {
      const intensity = 1 - topBlockRow / dangerRows; // 1 = critique, 0 = safe
      const pulse = 0.5 + 0.5 * Math.sin(timestamp * 0.012);
      const alpha = intensity * (0.18 + pulse * 0.25);
      ctx.save();
      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.75,
      );
      grad.addColorStop(0, 'rgba(255,30,30,0)');
      grad.addColorStop(1, `rgba(255,30,30,${alpha})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }

  // Combo display
  if (game.combo > 0 && game.started && !game.gameOver && !game.marathonWon && !game.paused) {
    ctx.save();
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    const comboAlpha = Math.min(1, 0.5 + game.combo * 0.1);
    ctx.fillStyle = `rgba(255,200,50,${comboAlpha})`;
    ctx.fillText(`COMBO ×${game.combo}`, 8, 16);
    ctx.restore();
  }

  // Timer en haut à droite
  if (game.started && !game.gameOver && !game.paused) {
    ctx.save();
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '12px monospace';
    ctx.fillText(Game.formatTime(game.elapsedTime), canvas.width - 8, 16);
    if (game.highScore > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '10px monospace';
      ctx.fillText(`Record: ${game.highScore}`, canvas.width - 8, 28);
    }
    ctx.restore();
  }

  // Theme progress bar (sidebar)
  if (themeProgressBar && game.started && !game.gameOver) {
    const progress = themeManager.getCycleProgress(timestamp);
    themeProgressBar.style.width = `${progress * 100}%`;
    const themeColor = renderer.theme?.borderColor || '#fff';
    if (themeColor !== _lastThemeColor) {
      themeProgressBar.style.background = themeColor;
      _lastThemeColor = themeColor;
    }
  }

  if (game.gameOver) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 60);
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`Score : ${game.score}`, canvas.width / 2, canvas.height / 2 - 25);
    ctx.font = '16px monospace';
    ctx.fillText(`${game.stats.pieces} pièces · ${game.stats.tSpins} T-spins · combo max ×${game.stats.maxCombo}`, canvas.width / 2, canvas.height / 2);
    ctx.font = '14px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`Niveau ${game.level} · ${game.lines} lignes`, canvas.width / 2, canvas.height / 2 + 22);
    // Boutons Partager + JSON
    ctx.font = 'bold 12px monospace';
    // Partager
    const shareX = SHARE_BTN.x();
    const btnY = SHARE_BTN.y();
    ctx.fillStyle = shareFeedback > 0 ? 'rgba(100,255,100,0.2)' : 'rgba(255,255,255,0.15)';
    if (shareFeedback > 0) shareFeedback--;
    ctx.fillRect(shareX, btnY, SHARE_BTN.w, SHARE_BTN.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.strokeRect(shareX, btnY, SHARE_BTN.w, SHARE_BTN.h);
    ctx.fillStyle = '#fff';
    ctx.fillText(shareFeedback > 0 ? 'Copié !' : 'Partager', shareX + SHARE_BTN.w / 2, btnY + 19);
    if (shareFeedback < 0) shareFeedback++;
    // JSON
    const jsonX = JSON_BTN.x();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(jsonX, btnY, JSON_BTN.w, JSON_BTN.h);
    ctx.strokeRect(jsonX, btnY, JSON_BTN.w, JSON_BTN.h);
    ctx.fillStyle = '#fff';
    ctx.fillText('JSON', jsonX + JSON_BTN.w / 2, btnY + 19);
    ctx.font = '14px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(isTouchDevice ? 'Touche pour rejouer' : 'R pour rejouer', canvas.width / 2, btnY + 50);
    ctx.restore();
    // Explosion sombre par-dessus l'overlay
    particles.update();
    particles.draw(ctx);
  } else if (game.paused) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSE', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '16px monospace';
    ctx.fillText('Échap ou P pour reprendre', canvas.width / 2, canvas.height / 2 + 20);
    ctx.restore();
  } else if (!game.started) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TETRIS', canvas.width / 2, canvas.height / 2 - 60);
    ctx.font = 'bold 16px monospace';
    ctx.fillText(isTouchDevice ? 'Touche pour jouer' : 'ESPACE pour jouer', canvas.width / 2, canvas.height / 2 - 15);
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    if (isTouchDevice) {
      ctx.fillText('tap centre : rotate · tap côtés : move', canvas.width / 2, canvas.height / 2 + 20);
      ctx.fillText('swipe bas : hard drop · swipe haut long : hold', canvas.width / 2, canvas.height / 2 + 38);
    } else {
      ctx.fillText('←→ : move · ↑ : rotate · ESPACE : hard drop', canvas.width / 2, canvas.height / 2 + 20);
      ctx.fillText('C : hold · P/Échap : pause', canvas.width / 2, canvas.height / 2 + 38);
    }
    if (game.highScore > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText(`Record : ${game.highScore}`, canvas.width / 2, canvas.height / 2 + 60);
    }
    ctx.restore();
  }

  requestAnimationFrame(loop);
}

// Démarrage direct en mode AI vs AI : l'HTML affiche déjà versus-app, mais on
// appelle setMode pour enclencher l'ambient, le commentator et la seed versus
// du ResizeObserver. mode interne = 'solo' → passe par la branche 'versus-on'.
setMode('versus');

requestAnimationFrame(loop);
