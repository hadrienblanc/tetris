# CURRENT — Avancement Tetris

## Statut : Phase 13 complète (Hard drop trail intermédiaire)

### Fait
- [x] Phase 1 : Core game
- [x] Phase 2 : 10 thèmes + rotation 10s
- [x] Phase 3 : AI auto-play
- [x] Phase 4 : Particules + touch + responsive + ghost + son
- [x] Phase 5 : Hold piece + lock delay + pause
- [x] Phase 6 : High score + line clear animation + combo + back-to-back
- [x] Phase 7 : T-spin detection + scoring
- [x] Phase 8 : Labels flottants T-SPIN / COMBO / BACK-TO-BACK
- [x] Phase 9 : Stats de fin de partie + son T-spin
- [x] Phase 10 : Animation line clear shrink vers le centre
- [x] Phase 11 : Hard drop trail (traînée lumineuse)
- [x] Phase 12 : AI look-ahead 2 pièces
- [x] Phase 13 : Hard drop trail intermédiaire (toutes les positions Y)

### Tests
- [x] 95 tests Vitest — tous verts

### Reviews (ce tour)
- Kimi trail intermédiaire : pas de bug critique, duplicats mineurs acceptables
- MinMax trail intermédiaire : même diagnostic, test renforcé

### Commits (récents)
- 164ca01 Hard drop trail intermédiaire : toutes les positions Y
- b36c75a Test renforcé : vérifie les Y intermédiaires dans le trail

### Blocage
Aucun

### Prochaine étape potentielle
- Son combo + back-to-back
- DAS configurable
- Export stats / partage de score
- Thème dynamique basé sur le score
- Amélioration particles (explosion au line clear)
