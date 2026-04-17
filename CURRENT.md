# CURRENT — Avancement Tetris

## Statut : Phase 28 complète (Touch controls avancés)

### Fait
- [x] Phases 1-16 : Core, thèmes, AI, polish, hold, scoring, T-spin, labels, stats, effects
- [x] Phase 17-23 : Thème dynamique, flash, popup, démarrage, DAS, ambient, blur cleanup
- [x] Phase 24-27 : Export stats, responsive, perf, GitHub Pages
- [x] Phase 28 : Touch avancé (2 doigts=hard drop, swipe haut long=hold, aide gestes)

### Tests
- [x] 159 tests Vitest — tous verts

### En ligne
**https://hadrienblanc.github.io/tetris/**

### Reviews
- Kimi : targetTouches au lieu de touches → corrigé
- Kimi : touchcancel handler manquant → corrigé
- Kimi : twoFingerTap pendant geste existant → corrigé (trackingId guard)
- Kimi : texte aide imprécis → corrigé ("tap centre : rotate")
- MinMax : hard drop swipe-up→swipe-down intentionnel, pas un bug

### Commits (récents)
- 8a4ef5d Fix review: targetTouches, touchcancel, texte aide précisé
- 92227a6 Touch avancé : 2 doigts=hard drop, swipe haut long=hold, aide gestes

### Blocage
Aucun

### Prochaine étape potentielle
- Accessibility (ARIA labels, contraste)
- README avec screenshots/GIF
- Mode marathon / objectifs
- Son personnalisé par thème
