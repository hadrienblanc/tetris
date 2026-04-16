# CURRENT — Avancement Tetris

## Statut : Phase 12 complète (AI look-ahead 2 pièces)

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

### Phase 12 — Détail
- Pour chaque position (rot,x) de current, simule toutes les positions de next
- Score cumulé : evaluate(board1) + max(evaluate(board2))
- Fallback à 0 si bestSecondScore = -Infinity (fix Kimi)
- Performance : ~2300 simulations < 1ms

### Tests
- [x] 95 tests Vitest — tous verts

### Reviews
- Kimi : bug -Infinity sur bestSecondScore → corrigé
- MinMax : même diagnostic

### Commits (récents)
- 3f11036 AI look-ahead 2 pièces
- 0c48b78 Fix review : fallback bestSecondScore + edge case test

### Blocage
Aucun

### Prochaine étape potentielle
- DAS configurable
- Hard drop trail intermédiaire (cellules entre start et end)
- Export stats / partage de score
- Son combo / back-to-back
- Thème dynamique basé sur le score
