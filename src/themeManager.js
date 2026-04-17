import { themes } from './themes.js';
import * as Sound from './sound.js';

const STORAGE_KEY = 'tetris-theme';

export class ThemeManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.transitioning = false;
    this.transitionProgress = 0;
    this.previousTheme = null;
    this.cycleInterval = 10000;
    this.lastCycle = -1;
    this.started = false;
    this._levelMode = false;

    // Charger thème sauvegardé ou démarrer à 0
    const saved = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    this.index = (Number.isFinite(saved) && saved >= 0 && saved < themes.length) ? saved : 0;
    this.theme = themes[this.index];

    this.renderer.setTheme(this.theme);
    if (this.theme.sound) Sound.setThemePitch(this.theme.sound.pitch);
    if (this.theme.sound?.waveform) Sound.setThemeWaveform(this.theme.sound.waveform);
  }

  update(timestamp) {
    if (!this.started) {
      this.lastCycle = timestamp;
      this.started = true;
    }

    if (this.transitioning) {
      this.transitionProgress += 0.04;
      if (this.transitionProgress >= 1) {
        this.transitionProgress = 1;
        this.transitioning = false;
        this.previousTheme = null;
      }
    }

    this.renderer.setTransition(this.previousTheme, this.theme, this.transitionProgress);

    if (!this._levelMode && !this.transitioning && timestamp - this.lastCycle >= this.cycleInterval) {
      this.lastCycle = timestamp;
      this.next();
    }
  }

  setLevel(level) {
    if (!level || level < 1) return;
    const targetIndex = Math.min(themes.length - 1, Math.floor((level - 1) / 2));
    if (targetIndex !== this.index) {
      this._switchTo(targetIndex);
      this._levelMode = true;
    }
  }

  _switchTo(targetIndex) {
    this.previousTheme = this.theme;
    this.index = targetIndex;
    this.theme = themes[targetIndex];
    this.transitioning = true;
    this.transitionProgress = 0;
    this.renderer.setTheme(this.theme);
    if (this.theme.sound) Sound.setThemePitch(this.theme.sound.pitch);
    if (this.theme.sound?.waveform) Sound.setThemeWaveform(this.theme.sound.waveform);
    if (this.onThemeChange) this.onThemeChange(targetIndex);
    try { localStorage.setItem(STORAGE_KEY, targetIndex); } catch { /* storage indisponible */ }
  }

  next() {
    this._switchTo((this.index + 1) % themes.length);
  }

  getName() {
    return this.theme.name;
  }

  setThemeIndex(index) {
    if (index < 0 || index >= themes.length || index === this.index) return;
    this._switchTo(index);
    this._levelMode = true;
  }
}
