# CURRENT — Avancement Tetris

## Statut : Phase 9 complète (Stats de fin de partie + son T-spin)

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

### Phase 9 — Détail
- Tracking stats : `stats.pieces`, `stats.tSpins`, `stats.maxCombo`
- `playTSpin()` appelé dans le callback `onTSpin`
- Overlay game over : score + pièces + T-spins + combo max
- T-spin 0-ligne compté dans stats (bug fix reviews Kimi+MinMax)

### Tests
- [x] 80 tests Vitest — tous verts
- [x] 6 nouveaux tests stats (init, pieces, tSpins, maxCombo, reset, no-regression)

### Reviews
- Kimi review stats : bug T-spin 0-ligne non compté → corrigé
- MinMax review stats : même diagnostic → même fix

### Commits (récents)
- ac3962c Stats de fin de partie + son T-spin
- ff5bcd9 Fix : T-spin 0-ligne compté dans stats.tSpins

### Blocage
Aucun

### Prochaine étape potentielle
- Amélioration animation line clear (shrink vers le centre)
- Amélioration AI (look-ahead 2 pièces)
- Export des stats / leaderboard
- Thème dynamique basé sur le score
