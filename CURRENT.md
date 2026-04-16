# CURRENT — Avancement Tetris

## Statut : Phase 5 complète (Hold + Lock delay + Pause)

### Fait
- [x] Phase 1 : Core game
- [x] Phase 2 : 10 thèmes + rotation 10s
- [x] Phase 3 : AI auto-play
- [x] Phase 4 : Particules + touch + responsive + ghost + son
- [x] Phase 5 : Hold piece + lock delay + pause

### Tests
- [x] 45 tests Vitest — tous verts

### Reviews
- Kimi review hold+lock : 2 bugs corrigés (lockTimer, hold collision)
- Kimi review pause : 3 bugs critiques (actions non bloquées, lock delay consommé, IA continue) → tous corrigés
- MinMax review pause : même diagnostic (lock delay + actions) → confirmé et corrigé

### Commits
- a0337e1 Hold piece + lock delay
- 147083e Fix lock timer + hold collision
- 5d9b7a7 Ajout pause (Échap/P) avec overlay et tests
- a5601ad Fix pause : bloque actions, compense lock delay, arrête IA/particules

### Blocage
Aucun

### Prochaine étape potentielle
- T-spin detection + scoring
- Combo système
- High score persistence (localStorage)
- Back-to-back bonus
- Visual line clear animation (flash before removal)
