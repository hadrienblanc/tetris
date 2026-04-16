# CURRENT — Avancement Tetris

## Statut : Phase 8 complète (Labels flottants)

### Fait
- [x] Phase 1 : Core game
- [x] Phase 2 : 10 thèmes + rotation 10s
- [x] Phase 3 : AI auto-play
- [x] Phase 4 : Particules + touch + responsive + ghost + son
- [x] Phase 5 : Hold piece + lock delay + pause
- [x] Phase 6 : High score + line clear animation + combo + back-to-back
- [x] Phase 7 : T-spin detection + scoring
- [x] Phase 8 : Labels flottants T-SPIN / COMBO / BACK-TO-BACK

### Tests
- [x] 74 tests Vitest — tous verts

### Reviews
- Kimi review labels : 2 bugs (else if supprime B2B, labels non vidés) → corrigés
- MinMax review labels : complété (même diagnostic)

### Commits (récents)
- 061a51a Labels flottants + callbacks onTSpin/onCombo/onBackToBack
- 89ea466 Fix review : else if → if, labels vidés, positions stables

### Blocage
Aucun

### Prochaine étape potentielle
- Stats de fin de partie (pièces posées, T-spins, max combo)
- Amélioration animation line clear (shrink)
- Son T-spin
