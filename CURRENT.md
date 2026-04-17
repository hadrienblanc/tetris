# CURRENT — Avancement Tetris

## Statut : Phase 20 complète (Écran de démarrage)

### Fait
- [x] Phases 1-8 : Core, thèmes, AI, polish, hold, scoring, T-spin, labels
- [x] Phases 9-16 : Stats, shrink, trail, AI look-ahead 2, sons, particules, shake
- [x] Phase 17 : Thème dynamique par niveau
- [x] Phase 18 : Flash visuel au level up
- [x] Phase 19 : Score popup flottant au clear
- [x] Phase 20 : Écran de démarrage (idle state, overlay, ESPACE/Touch)

### Tests
- [x] 127 tests Vitest — tous verts

### Reviews
- Kimi : holdPiece/togglePause manquaient la garde started → corrigé
- MinMax : RAS, implémentation propre

### Commits (récents)
- 0d03284 Fix review: holdPiece/togglePause bloqués avant start, AI.update() défensif
- 9521ca0 Écran de démarrage : idle state + overlay ESPACE/Touch

### Blocage
Aucun

### Prochaine étape potentielle
- DAS configurable
- Export stats / partage
- Responsive mobile
- Ambient effects par thème
