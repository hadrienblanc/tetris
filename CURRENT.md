# CURRENT — Avancement Tetris

## Statut : Phase 14 complète (Sons combo + back-to-back)

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
- [x] Phase 13 : Hard drop trail intermédiaire
- [x] Phase 14 : Sons combo + back-to-back

### Phase 14 — Détail
- playCombo(n) : triangle montante 300+n*50 Hz
- playBackToBack() : square ascendante 500→700→900 Hz
- Cleanup doublon onGameOver (code mort)

### Tests
- [x] 95 tests Vitest — tous verts

### Reviews
- MinMax : onGameOver assigné 2 fois (code mort) → nettoyé
- Kimi : pas de bug

### Commits (récents)
- 9883e18 Sons combo + back-to-back
- 6806da4 Cleanup : supprime le doublon onGameOver

### Blocage
Aucun

### Prochaine étape potentielle
- DAS configurable
- Thème dynamique basé sur le score
- Amélioration particles (explosion au line clear)
- Export stats / partage de score
