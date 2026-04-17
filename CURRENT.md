# CURRENT — Avancement Tetris

## Statut : Phase 69 complète (particules de verrouillage)

### Fait
- [x] Phases 1-16 : Core, thèmes, AI, polish, hold, scoring, T-spin, labels, stats, effects
- [x] Phase 17-27 : Thème dynamique, effets, responsive, perf, GitHub Pages
- [x] Phase 28-37 : Touch, son thème, a11y, marathon, timer, particules, README, waveforms, leaderboard
- [x] Phase 38-44 : Particules game over, difficulté, persister, son, overlays, fix holdPiece
- [x] Phase 45-54 : Son par difficulté, combo display, leaderboard titre, reset, export JSON, download
- [x] Phase 55-59 : Bouton JSON, son combo/T-spin/B2B enrichis, preview/hold animées
- [x] Phase 60-61 : Son B2B enrichi, high score HUD marathon
- [x] Phase 62-65 : Sons level-up/victoire par difficulté, DIFF_WAVE partagée
- [x] Phase 66-68 : Sons combo/T-spin/B2B/clear par difficulté (tous difficulty-aware)
- [x] Phase 69 : Particules de verrouillage (emitLock, burst subtil, fix {x,y} Kimi)

### Tests
- [x] 241 tests Vitest — tous verts

### En ligne
**https://hadrienblanc.github.io/tetris/**

### Commits (récents)
- 1bb5af4 Fix : emitLock {x,y} (bug Kimi)
- a88e03b Phase 69 : particules de verrouillage
- c5434ad Phase 68 : son line clear par difficulté

### Blocage
Aucun

### Prochaine étape potentielle
- Thème éditeur (custom colors)
- Demo GIF animé dans README
- Ghost piece amélioré (outline dashed)
- Board border pulse on line clear
