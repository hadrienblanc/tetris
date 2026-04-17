import './style.css';
import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { ThemeManager } from './themeManager.js';
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
const game = new Game({ marathonTarget: 40 });
const renderer = new Renderer(canvas, preview);
const input = new Input(game);
const themeManager = new ThemeManager(renderer);
const ai = new AI(game);
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
  Sound.playClear(count);
  announce(`${count} ligne${count > 1 ? 's' : ''} effacée${count > 1 ? 's' : ''}`);
  for (let i = 0; i < rows.length; i++) {
    particles.emitRowFromSnapshot(rows[i], snapshots[i], CELL, renderer.theme);
  }
};
game.onLevelUp = (level) => { themeManager.setLevel(level); Sound.playLevelUp(); announce(`Niveau ${level}`); };
game.onLock = () => Sound.playLock();

// Labels flottants
const floatingLabels = [];
let labelStackY = 0;
function addLabel(text) {
  const yBase = canvas.height / 2 - labelStackY;
  labelStackY += 22;
  floatingLabels.push({ text, t: 0, duration: 60, yBase });
}

game.onTSpin = (lines) => {
  Sound.playTSpin();
  const label = lines === 0 ? 'T-SPIN!' : `T-SPIN ${lines === 1 ? 'SINGLE' : lines === 2 ? 'DOUBLE' : 'TRIPLE'}!`;
  addLabel(label);
};
game.onScoreEarned = (points) => {
  if (points > 0) addLabel(`+${points}`);
};
game.onBackToBack = () => { Sound.playBackToBack(); addLabel('BACK-TO-BACK!'); };
game.onCombo = (n) => { Sound.playCombo(n); addLabel(`COMBO ×${n}`); };
game.onReset = () => { themeManager.setLevel(1); themeManager._levelMode = false; canvas.setAttribute('aria-label', 'Grille de jeu Tetris — en attente'); announce(''); };
game.onStart = () => { canvas.setAttribute('aria-label', 'Grille de jeu Tetris — en cours'); announce('Partie commencée'); };
game.onPause = (paused) => { canvas.setAttribute('aria-label', `Grille de jeu Tetris — ${paused ? 'en pause' : 'en cours'}`); if (paused) announce('Pause'); };
game.onGameOver = () => { Sound.playGameOver(); floatingLabels.length = 0; canvas.setAttribute('aria-label', 'Grille de jeu Tetris — game over'); announce(`Game over. Score : ${game.score}. ${game.stats.pieces} pièces, niveau ${game.level}`); };
game.onVictory = () => {
  Sound.playLevelUp();
  announce(`Victoire ! ${game.marathonTarget} lignes en ${game.stats.pieces} pièces !`);
  // Feux d'artifice
  const theme = renderer.theme;
  const fireworkColors = theme?.cells ? Object.values(theme.cells) : ['#ffd700', '#fff', '#ff69b4'];
  const w = canvas.width;
  const h = canvas.height;
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      if (game.marathonWon) {
        particles.emitFirework(
          40 + Math.random() * (w - 80),
          h * 0.3 + Math.random() * h * 0.3,
          fireworkColors,
        );
      }
    }, i * 300);
  }
};

// Sons — intercepter les actions de l'input
const origHandleKey = input._handleKey.bind(input);
input._handleKey = (code) => {
  const prevScore = game.score;
  origHandleKey(code);
  if (game.gameOver) return;
  if (code === 'ArrowLeft' || code === 'ArrowRight') Sound.playMove();
  else if (code === 'ArrowUp') { if (game.current) Sound.playRotate(); }
  else if (code === 'Space') Sound.playDrop();
};

// Partager stats (clic sur bouton "Partager" dans l'overlay game over)
const SHARE_BTN = { w: 120, h: 30 };
SHARE_BTN.x = () => canvas.width / 2 - SHARE_BTN.w / 2;
SHARE_BTN.y = () => canvas.height / 2 + 40;
let shareFeedback = 0; // frames restantes pour afficher "Copié !"

function isShareHit(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (clientX - rect.left) * scaleX;
  const y = (clientY - rect.top) * scaleY;
  const bx = SHARE_BTN.x();
  const by = SHARE_BTN.y();
  return x >= bx && x <= bx + SHARE_BTN.w && y >= by && y <= by + SHARE_BTN.h;
}

// Contrôles tactile (passe isShareHit pour éviter le reset au tap sur Partager)
new TouchControls(game, canvas, { isShareHit });

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
});

// Toggle AI
const aiBtn = document.getElementById('ai-toggle');
aiBtn.addEventListener('click', () => {
  ai.toggle();
  aiBtn.textContent = ai.isActive() ? 'Mode : AI' : 'Mode : Manuel';
  aiBtn.classList.toggle('active', ai.isActive());
  aiBtn.setAttribute('aria-pressed', ai.isActive());
});

// Vitesse AI
const speedSlider = document.getElementById('ai-speed');
const speedLabel = document.getElementById('ai-speed-label');
if (speedSlider) {
  speedSlider.addEventListener('input', () => {
    const val = parseInt(speedSlider.value);
    ai.setSpeed(val);
    speedLabel.textContent = val + 'ms';
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
  } else if (game.marathonWon) {
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
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label.text, canvas.width / 2, label.yBase + yOff);
    ctx.restore();
  }
  // Reset stack quand tous les labels sont partis
  if (floatingLabels.length === 0) labelStackY = 0;

  // Barre de progression marathon + timer
  if (game.marathonTarget > 0 && game.started && !game.gameOver && !game.marathonWon && !game.paused) {
    const progress = Math.min(1, game.lines / game.marathonTarget);
    const barW = canvas.width - 20;
    const barH = 6;
    const barX = 10;
    const barY = canvas.height - 14;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = 'rgba(100,255,100,0.6)';
    ctx.fillRect(barX, barY, barW * progress, barH);
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'right';
    ctx.fillText(`${game.lines}/${game.marathonTarget}`, canvas.width - 10, barY - 3);
    // Timer en haut à droite
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '12px monospace';
    ctx.fillText(Game.formatTime(game.elapsedTime), canvas.width - 8, 16);
    ctx.restore();
  }

  if (game.marathonWon) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VICTOIRE !', canvas.width / 2, canvas.height / 2 - 80);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(Game.formatTime(game.elapsedTime), canvas.width / 2, canvas.height / 2 - 45);
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`${game.marathonTarget} lignes · Score : ${game.score}`, canvas.width / 2, canvas.height / 2 - 15);
    ctx.font = '14px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`${game.stats.pieces} pièces · Niveau ${game.level}`, canvas.width / 2, canvas.height / 2 + 10);
    if (game.bestTime > 0) {
      ctx.fillStyle = '#ffd700';
      ctx.fillText(`Record : ${Game.formatTime(game.bestTime)}`, canvas.width / 2, canvas.height / 2 + 35);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(isTouchDevice ? 'Touche pour rejouer' : 'R pour rejouer', canvas.width / 2, canvas.height / 2 + 60);
    ctx.restore();
  } else if (game.gameOver) {
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
    // Bouton Partager
    const btnX = SHARE_BTN.x();
    const btnY = SHARE_BTN.y();
    if (shareFeedback > 0) {
      ctx.fillStyle = 'rgba(100,255,100,0.2)';
      shareFeedback--;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
    }
    ctx.fillRect(btnX, btnY, SHARE_BTN.w, SHARE_BTN.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.strokeRect(btnX, btnY, SHARE_BTN.w, SHARE_BTN.h);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(shareFeedback > 0 ? 'Copié !' : 'Partager', canvas.width / 2, btnY + 20);
    if (shareFeedback < 0) shareFeedback++;
    ctx.font = '14px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(isTouchDevice ? 'Touche pour rejouer' : 'R pour rejouer', canvas.width / 2, btnY + 50);
    ctx.restore();
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
    ctx.fillText('TETRIS', canvas.width / 2, canvas.height / 2 - 80);
    ctx.font = 'bold 16px monospace';
    ctx.fillText(isTouchDevice ? 'Touche pour jouer' : 'ESPACE pour jouer', canvas.width / 2, canvas.height / 2 - 30);
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    if (isTouchDevice) {
      ctx.fillText('tap centre : rotate · tap côtés : move', canvas.width / 2, canvas.height / 2 + 10);
      ctx.fillText('swipe bas : hard drop · swipe haut long : hold', canvas.width / 2, canvas.height / 2 + 28);
    } else {
      ctx.fillText('←→ : move · ↑ : rotate · ESPACE : hard drop', canvas.width / 2, canvas.height / 2 + 10);
      ctx.fillText('C : hold · P/Échap : pause', canvas.width / 2, canvas.height / 2 + 28);
    }
    ctx.fillText('AI · 10 thèmes · marathon 40 lignes', canvas.width / 2, canvas.height / 2 + 55);
    ctx.restore();
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
