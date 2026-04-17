# CURRENT — Avancement Tetris

## Statut : Phase 81 complète (hard drop distance label)

### Fait
- [x] Phases 1-16 : Core, thèmes, AI, polish, hold, scoring, T-spin, labels, stats, effects
- [x] Phase 17-27 : Thème dynamique, effets, responsive, perf, GitHub Pages
- [x] Phase 28-37 : Touch, son thème, a11y, marathon, timer, particules, README, waveforms, leaderboard
- [x] Phase 38-44 : Particules game over, difficulté, persister, son, overlays, fix holdPiece
- [x] Phase 45-54 : Son par difficulté, combo display, leaderboard titre, reset, export JSON, download
- [x] Phase 55-59 : Bouton JSON, son combo/T-spin/B2B enrichis, preview/hold animées
- [x] Phase 60-68 : Sons B2B enrichi, high score HUD, tous sons difficulty-aware
- [x] Phase 69-73 : Particules lock, ghost dashed, border glow, spawn anim, lock flash
- [x] Phase 74-77 : README, sélecteur thème, labels colorés, thème persisté
- [x] Phase 78 : Next piece queue (3 pièces suivantes)
- [x] Phase 79 : AI look-ahead 3-plies (discount 0.7)
- [x] Phase 80 : Responsive CSS amélioré (queue, controls, reset button)
- [x] Phase 81 : Hard drop distance label (↓N si > 3 lignes)

### Tests
- [x] 252 tests Vitest — tous verts

### En ligne
**https://hadrienblanc.github.io/tetris/**

### Commits (récents)
- f29cbd7 Fix : #theme-label mort media query (Kimi)
- a473d1f Phase 81 : hard drop distance label
- b148368 Phase 80 : responsive CSS

### Blocage
Aucun

### Prochaine étape potentielle
- Theme editor (custom colors)
- Son playMove/playRotate par difficulté
- Score counter animation
- Line clear streak indicator
