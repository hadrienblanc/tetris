# CURRENT — Avancement Tetris

## Statut : Phase 17 complète (Thème dynamique par niveau)

### Fait
- [x] Phases 1-8 : Core, thèmes, AI, polish, hold, scoring, T-spin, labels
- [x] Phases 9-16 : Stats, shrink, trail, AI look-ahead 2, sons, particules, shake
- [x] Phase 17 : Thème dynamique basé sur le niveau

### Phase 17 — Détail
- Thème change tous les 2 niveaux (floor((level-1)/2))
- Timer 10s désactivé en mode niveau (_levelMode)
- onReset callback pour remettre le thème à 0 au restart
- 9 tests ThemeManager + 1 test onReset

### Tests
- [x] 110 tests Vitest — tous verts

### Reviews
- Kimi + MinMax : _levelMode jamais reset + thème pas remis au restart → corrigé

### Commits (récents)
- 53ce7ff Thème dynamique basé sur le niveau
- 9edf7f2 Fix review : thème reset au game restart

### Blocage
Aucun

### Prochaine étape potentielle
- DAS configurable
- Export stats / partage de score
- Amélioration responsive mobile
- Nouveaux effets visuels (rain, snow par thème)
