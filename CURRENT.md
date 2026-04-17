# CURRENT — Avancement Tetris

## Statut : Phase 40 complète (Persister difficulté)

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
- [x] Phase 39 : Difficulté sélectionnable (facile/normal/difficile)
- [x] Phase 40 : Persister difficulté dans localStorage

### Tests
- [x] 209 tests Vitest — tous verts

### En ligne
**https://hadrienblanc.github.io/tetris/**

### Reviews
- Kimi (38) : explosion jamais rendue → fix appliqué
- MinMax (38) : palette test fragile, decay lent OK

### Commits (récents)
- 0f23dbd Phase 40 : persister difficulté dans localStorage
- 548919a Phase 39 : difficulté sélectionnable (facile/normal/difficile)

### Blocage
Aucun

### Prochaine étape potentielle
- HoldPiece onGameOver manquant (Kimi, préexistant)
- Thème éditeur (custom colors)
- Demo GIF animé dans README
- Son game over distinct
