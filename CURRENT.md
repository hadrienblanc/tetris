# CURRENT — Avancement Tetris

## Statut : Phase 27 complète (Déploiement GitHub Pages)

### Fait
- [x] Phases 1-16 : Core, thèmes, AI, polish, hold, scoring, T-spin, labels, stats, effects
- [x] Phase 17-20 : Thème dynamique, flash, popup, écran démarrage
- [x] Phase 21-23 : DAS configurable, ambient effects (8 types), blur cleanup
- [x] Phase 24-26 : Export stats, responsive mobile, perf + visibilitychange
- [x] Phase 27 : Déploiement GitHub Pages (Actions, base /tetris/, .gitignore)

### Tests
- [x] 159 tests Vitest — tous verts

### En ligne
**https://hadrienblanc.github.io/tetris/**

### Reviews
- Kimi : npm install → npm ci, ajouter cache npm, npm run build → appliqué
- MinMax : LGTM, suggestion homepage field (cosmétique)

### Commits (récents)
- 54b1871 Fix review: npm ci + cache npm + npm run build dans le workflow
- 24e706b GitHub Pages : workflow deploy + base /tetris/ + .gitignore

### Blocage
Aucun

### Prochaine étape potentielle
- Touch controls avancés (swipe hold)
- Accessibility (ARIA labels)
- Mode marathon
- README avec screenshots
