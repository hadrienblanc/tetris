# CURRENT — Avancement Tetris

## Statut : Phase 10 complète (Animation line clear shrink)

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

### Phase 10 — Détail
- Les cellules cleared shrinkent vers le centre horizontal avec fade-out
- Flash blanc initial (30% de l'animation)
- Getter `clearProgress` (0→1) déterministe via `_lastTimestamp`
- Clamp [0,1] du progress (fix review Kimi)
- Support glow dans `_drawClearingCell` (fix review Kimi)

### Tests
- [x] 83 tests Vitest — tous verts
- [x] 3 nouveaux tests clearProgress + 1 test renforcé

### Reviews
- Kimi review shrink : 3 issues (clamp, glow regression, test faible) → toutes corrigées

### Commits (récents)
- 8b28081 Animation line clear shrink vers le centre
- 552b002 Fix review : clamp clearProgress + glow shrink + test renforcé

### Blocage
Aucun

### Prochaine étape potentielle
- Amélioration AI (look-ahead 2 pièces)
- Hard drop trail (effet de traînée)
- DAS (Delayed Auto Shift) configurable
- Export stats / partage de score
