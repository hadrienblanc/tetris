# CURRENT — Avancement Tetris

## Statut : Phase 83 complète (marathon best time par difficulté)

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
- [x] Phase 78-79 : Queue 3 pièces, AI look-ahead 3-plies
- [x] Phase 80-82 : Responsive CSS, hard drop label, B2B streak counter
- [x] Phase 83 : Marathon best time par difficulté (leaderboard filtré, backward compat)

### Tests
- [x] 256 tests Vitest — tous verts

### En ligne
**https://hadrienblanc.github.io/tetris/**

### Commits (récents)
- 4e185f3 Fix : backward compat leaderboard (Kimi)
- c16f1ec Phase 83 : best time par difficulté
- 269f9f5 Update CURRENT.md

### Blocage
Aucun

### Prochaine étape potentielle
- Theme editor (custom colors)
- Score counter animation
- Per-difficulty leaderboard top 5 (au lieu de global)
- Son playMove/playRotate par difficulté
