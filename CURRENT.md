# CURRENT — Avancement Tetris

## Statut : Phase 11 complète (Hard drop trail)

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

### Phase 11 — Détail
- Cellules de départ + arrivée flashées avec fade-out 150ms
- `_trailPieceName` sauvegarde le nom avant lock/spawn (fix Kimi)
- Support glow dans le trail renderer
- `trailProgress` getter (0→1) déterministe

### Tests
- [x] 91 tests Vitest — tous verts

### Reviews
- Kimi : bug couleur trail (current.name après spawn) → corrigé
- MinMax : pas de bug critique, observations mineures

### Commits (récents)
- 62ea7f5 Hard drop trail : traînée lumineuse au hard drop
- 2ced52d Fix review : couleur trail sauvegardée avant lock/spawn

### Blocage
Aucun

### Prochaine étape potentielle
- Amélioration AI (look-ahead 2 pièces)
- DAS configurable
- Hard drop trail intermédiaire (toutes les cellules entre start et end)
- Export stats / partage de score
