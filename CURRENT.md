# CURRENT — Avancement Tetris

## Statut : Phase 82 complète (B2B streak counter)

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
- [x] Phase 80-81 : Responsive CSS, hard drop distance label
- [x] Phase 82 : B2B streak counter (b2bStreak, label ×N, fix double appel Kimi)

### Tests
- [x] 253 tests Vitest — tous verts

### En ligne
**https://hadrienblanc.github.io/tetris/**

### Commits (récents)
- 3ed5049 Fix : double appel onBackToBack (Kimi)
- c30c0da Phase 82 : B2B streak counter
- e32813b Update CURRENT.md

### Blocage
Aucun

### Prochaine étape potentielle
- Theme editor (custom colors)
- Score counter animation (count up)
- Son playMove/playRotate par difficulté
- Marathon best time par difficulté
