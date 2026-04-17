# CURRENT — Avancement Tetris

## Statut : Phase 78 complète (next piece queue 3 pièces)

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
- [x] Phase 78 : Next piece queue (3 pièces suivantes, queue canvases, animation)

### Tests
- [x] 252 tests Vitest — tous verts

### En ligne
**https://hadrienblanc.github.io/tetris/**

### Commits (récents)
- 8b28388 Fix : queue canvas border + cached contexts (Kimi)
- ecae148 Phase 78 : next piece queue
- dad9505 Update CURRENT.md

### Blocage
Aucun

### Prochaine étape potentielle
- AI look-ahead 3-plies (utiliser la queue)
- Hard drop distance counter
- Responsive CSS amélioré
- Theme editor (custom colors)
