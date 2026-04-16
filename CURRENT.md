# CURRENT — Avancement Tetris

## Statut : Phase 6 complète (Scoring avancé)

### Fait
- [x] Phase 1 : Core game
- [x] Phase 2 : 10 thèmes + rotation 10s
- [x] Phase 3 : AI auto-play
- [x] Phase 4 : Particules + touch + responsive + ghost + son
- [x] Phase 5 : Hold piece + lock delay + pause
- [x] Phase 6 : High score + line clear animation + combo + back-to-back

### Tests
- [x] 63 tests Vitest — tous verts

### Reviews
- Kimi review combo : 0 bug, recommande tests back-to-back → ajoutés
- MinMax review combo : 0 bug, même recommandation → ajoutés

### Commits (récents)
- 09003a0 Combo + back-to-back scoring
- 61809ea Ajout tests back-to-back + précision test combo

### Blocage
Aucun

### Prochaine étape potentielle
- T-spin detection + scoring
- Amélioration animation (shrink/explosion au lieu de flash)
- Statistiques de fin de partie
- Optimisation du rendu (dirty rectangles)
