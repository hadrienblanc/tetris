# CURRENT — Avancement Tetris

## Statut : Phase 26 complète (Perf + visibilitychange)

### Fait
- [x] Phases 1-16 : Core, thèmes, AI, polish, hold, scoring, T-spin, labels, stats, effects
- [x] Phase 17-20 : Thème dynamique, flash, popup, écran démarrage
- [x] Phase 21-23 : DAS configurable, ambient effects (8 types), blur cleanup
- [x] Phase 24-25 : Export stats, responsive mobile
- [x] Phase 26 : Perf (ctx cache, ambientDraw une seule fois) + visibilitychange

### Tests
- [x] 159 tests Vitest — tous verts

### Reviews
- Kimi : _ambientDraw réassigné chaque frame → corrigé (init unique)
- MinMax : pas de problème, implémentation correcte

### Commits (récents)
- 73f796d Fix review: _ambientDraw assigné une seule fois au lieu de chaque frame
- bc832ee Perf : ctx cache dans main.js + visibilitychange dans input.js

### Blocage
Aucun

### Prochaine étape potentielle
- Touch controls avancés (swipe hold, deux doigts rotate)
- Accessibility (ARIA labels)
- Mode marathon (objectifs/niveaux cibles)
- Déploiement GitHub Pages
