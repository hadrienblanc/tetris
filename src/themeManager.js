import { themes } from './themes.js';

export class ThemeManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.index = 0;
    this.theme = themes[0];
    this.transitioning = false;
    this.transitionProgress = 0;
    this.previousTheme = null;
    this.cycleInterval = 10000; // 10s
    this.lastCycle = -1; // sera set au premier update
    this.started = false;

    this.renderer.setTheme(this.theme);
  }

  update(timestamp) {
    // Init lastCycle au premier frame
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

    if (!this.transitioning && timestamp - this.lastCycle >= this.cycleInterval) {
      this.lastCycle = timestamp;
      this.next();
    }
  }

  next() {
    this.previousTheme = this.theme;
    this.index = (this.index + 1) % themes.length;
    this.theme = themes[this.index];
    this.transitioning = true;
    this.transitionProgress = 0;
    this.renderer.setTheme(this.theme);
  }

  getName() {
    return this.theme.name;
  }
}
