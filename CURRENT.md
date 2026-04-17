# CURRENT — Avancement Tetris

## Statut : Phase 38 complète (Particules game over)

### Fait
- [x] Phases 1-16 : Core, thèmes, AI, polish, hold, scoring, T-spin, labels, stats, effects
- [x] Phase 17-23 : Thème dynamique, flash, popup, démarrage, DAS, ambient, blur cleanup
- [x] Phase 24-27 : Export stats, responsive, perf, GitHub Pages
- [x] Phase 28 : Touch avancé (2 doigts=hard drop, swipe haut long=hold)
- [x] Phase 29 : Son personnalisé par thème (pitch 0.75–1.25, clamping)
- [x] Phase 30 : Accessibilité (ARIA, aria-live, focus-visible)
- [x] Phase 31 : Mode marathon (40 lignes, barre progression, écran victoire)
- [x] Phase 32 : Timer marathon (chrono, meilleur temps, formatTime)
- [x] Phase 33 : Particules victoire (feux d'artifice, 6 bursts)
- [x] Phase 34 : Son victoire distinct (C5-E5-G5-C6)
- [x] Phase 35 : README.md
- [x] Phase 36 : Waveforms par thème (sine/square/triangle/sawtooth)
- [x] Phase 37 : Leaderboard local (top 5 temps marathon, top 3 affiché)
- [x] Phase 38 : Particules game over (explosion sombre, 30-50 particules)

### Tests
- [x] 199 tests Vitest — tous verts

### En ligne
**https://hadrienblanc.github.io/tetris/**

### Reviews
- Kimi : explosion jamais rendue (particles.update/draw absents du bloc gameOver)
- MinMax : palette dupliquée dans test (fragile), decay lent = effet dramatique OK

### Commits (récents)
- f2be4a6 Fix review Kimi : explosion sombre rendue par-dessus l'overlay game over
- 5c91186 Phase 38 : particules game over (explosion sombre)

### Blocage
Aucun

### Prochaine étape potentielle
- Difficulté sélectionnable (facile/normal/difficile)
- Demo GIF animé dans README
- Thème éditeur (custom colors)
- HoldPiece onGameOver manquant (Kimi, préexistant)
