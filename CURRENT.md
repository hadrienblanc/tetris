# CURRENT — Avancement Tetris

## Statut : Phase 67 complète (tous sons événements difficulty-aware)

### Fait
- [x] Phases 1-16 : Core, thèmes, AI, polish, hold, scoring, T-spin, labels, stats, effects
- [x] Phase 17-27 : Thème dynamique, effets, responsive, perf, GitHub Pages
- [x] Phase 28-37 : Touch, son thème, a11y, marathon, timer, particules, README, waveforms, leaderboard
- [x] Phase 38-44 : Particules game over, difficulté, persister, son, overlays, fix holdPiece
- [x] Phase 45-54 : Son par difficulté, combo display, leaderboard titre, reset, export JSON, download
- [x] Phase 55-59 : Bouton JSON, son combo/T-spin/B2B enrichis, preview/hold animées
- [x] Phase 60 : Son back-to-back enrichi (4 notes ascendantes, finale sine)
- [x] Phase 61 : High score affiché pendant marathon (HUD discret, haut droite)
- [x] Phase 62 : Son level-up par difficulté
- [x] Phase 63 : README mis à jour (224 tests)
- [x] Phase 64 : Son victoire par difficulté
- [x] Phase 65 : DIFF_WAVE constante partagée + fix review Kimi/MinMax
- [x] Phase 66 : Sons combo et T-spin par difficulté
- [x] Phase 67 : Son back-to-back par difficulté (tous sons événements difficulty-aware)

### Tests
- [x] 236 tests Vitest — tous verts

### En ligne
**https://hadrienblanc.github.io/tetris/**

### Commits (récents)
- ad7ed97 Phase 67 : son back-to-back par difficulté
- 43cbc79 Phase 66 : sons combo et T-spin par difficulté
- 0dd1b43 Phase 65 : DIFF_WAVE constante partagée

### Blocage
Aucun

### Prochaine étape potentielle
- Thème éditeur (custom colors)
- Demo GIF animé dans README
- Hard drop trail coloré par thème (déjà fait implicitement)
- Son playClear par difficulté
