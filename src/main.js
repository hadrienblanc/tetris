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

const CELL = 30;
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
};
game.onLevelUp = (level) => { themeManager.setLevel(level); Sound.playLevelUp(game.difficulty); announce(`Niveau ${level}`); };
game.onLock = (cells, pieceName) => {
  Sound.playLock(game.difficulty);
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
function addLabel(text, color) {
  const yBase = canvas.height / 2 - labelStackY;
  labelStackY += 22;
  floatingLabels.push({ text, t: 0, duration: 60, yBase, color: color || '#fff' });
}

game.onTSpin = (lines) => {
  Sound.playTSpin(game.difficulty);
  const label = lines === 0 ? 'T-SPIN!' : `T-SPIN ${lines === 1 ? 'SINGLE' : lines === 2 ? 'DOUBLE' : 'TRIPLE'}!`;
  addLabel(label, '#ff00ff');
  // Burst T-spin : particules magenta
  const spinColors = ['#ff00ff', '#cc00ff', '#fff'];
  particles.emitFirework(canvas.width / 2, canvas.height / 2 - 40, spinColors);
  if (lines >= 2) {
    particles.emitFirework(canvas.width / 2 - 40, canvas.height / 2, spinColors);
    particles.emitFirework(canvas.width / 2 + 40, canvas.height / 2, spinColors);
  }
};
game.onScoreEarned = (points) => {
  if (points > 0) addLabel(`+${points}`, '#ffd700');
};
game.onHardDrop = (lines) => {
  if (lines > 3) addLabel(`↓${lines}`, 'rgba(255,255,255,0.6)');
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
game.onReset = () => { themeManager.setLevel(1); themeManager._levelMode = false; canvas.setAttribute('aria-label', 'Grille de jeu Tetris — en attente'); announce(''); clearVictoryTimers(); particles.particles.length = 0; renderer.resetCounters(); };
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

function loop(timestamp) {
  if (!game.paused && !game.gameOver && !game.marathonWon && game.started && game.clearingRows.length === 0) ai.update(timestamp);
  game.update(timestamp);
  themeManager.update(timestamp);

  // Ambient effects — toujours actifs (cosmétique)
  const currentTheme = renderer.theme;
  ambient.setTheme(currentTheme);
  ambient.update(currentTheme);

  renderer.draw(game);

  if (!game.paused && !game.gameOver) {
    particles.update();
    particles.draw(ctx);
  }

  // Labels flottants
  for (let i = floatingLabels.length - 1; i >= 0; i--) {
    const label = floatingLabels[i];
    label.t++;
    const progress = label.t / label.duration;
    if (progress >= 1) { floatingLabels.splice(i, 1); continue; }
    const alpha = 1 - progress;
    const yOff = -progress * 40;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = label.color;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 3;
    ctx.strokeText(label.text, canvas.width / 2, label.yBase + yOff);
    ctx.fillText(label.text, canvas.width / 2, label.yBase + yOff);
    ctx.restore();
  }
  // Reset stack quand tous les labels sont partis
  if (floatingLabels.length === 0) labelStackY = 0;

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

requestAnimationFrame(loop);
