# CURRENT — Avancement Tetris

## Statut : Phase 22 complète (Ambient effects par thème)

### Fait
- [x] Phases 1-8 : Core, thèmes, AI, polish, hold, scoring, T-spin, labels
- [x] Phases 9-16 : Stats, shrink, trail, AI look-ahead 2, sons, particules, shake
- [x] Phase 17 : Thème dynamique par niveau
- [x] Phase 18 : Flash visuel au level up
- [x] Phase 19 : Score popup flottant au clear
- [x] Phase 20 : Écran de démarrage (idle state, overlay, ESPACE/Touch)
- [x] Phase 21 : DAS configurable (sliders, localStorage, clamping)
- [x] Phase 22 : Ambient effects (8 types : snow, rain, sparkle, bubble, leaf, ember, dust, pixel)

### Tests
- [x] 150 tests Vitest — tous verts

### Reviews
- Kimi : ambient dessiné au-dessus du board → corrigé (callback dans renderer)
- Kimi : même type ambient ne rebuild pas → corrigé (compare count+speed)
- MinMax : mêmes bugs identifiés + suggestions ctx cache

### Commits (récents)
- ee07a18 Fix review: ambient derrière le board, rebuild si même type/config différente
- 4fb6da4 Ambient effects par thème : neige, pluie, étincelles, bulles, feuilles, braises

### Blocage
Aucun

### Prochaine étape potentielle
- Keyboard blur cleanup (DAS runaway fix)
- Export stats / partage
- Responsive mobile complet
- Canvas resize handler pour ambient
