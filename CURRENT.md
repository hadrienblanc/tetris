# CURRENT — Avancement Tetris

## Statut : Phase 7 complète (T-spin detection)

### Fait
- [x] Phase 1 : Core game
- [x] Phase 2 : 10 thèmes + rotation 10s
- [x] Phase 3 : AI auto-play
- [x] Phase 4 : Particules + touch + responsive + ghost + son
- [x] Phase 5 : Hold piece + lock delay + pause
- [x] Phase 6 : High score + line clear animation + combo + back-to-back
- [x] Phase 7 : T-spin detection + scoring (400/800/1200/1600 × level)

### Tests
- [x] 70 tests Vitest — tous verts

### Reviews
- Kimi review T-spin : 4 bugs critiques (NaN triple, bonus 0-ligne code mort, lastTSpin leak, hold ne reset rotation) → tous corrigés
- MinMax review T-spin : timeout (non reçu)

### Commits (récents)
- 64df9b3 T-spin detection + scoring
- 8ee7543 Fix review Kimi : NaN, code mort, reset flags

### Blocage
Aucun

### Prochaine étape potentielle
- Amélioration visuelle du T-spin (label/flash "T-SPIN!")
- Statistiques de fin de partie
- Optimisation du rendu
- Amélioration animation line clear (shrink)
