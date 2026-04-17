# CURRENT — Avancement Tetris

## Statut : Phase 16 complète (Screen shake au Tetris)

### Fait
- [x] Phases 1-8 : Core game, 10 thèmes, AI, polish, hold, scoring, T-spin, labels
- [x] Phase 9 : Stats de fin de partie + son T-spin
- [x] Phase 10 : Animation line clear shrink vers le centre
- [x] Phase 11 : Hard drop trail (traînée lumineuse)
- [x] Phase 12 : AI look-ahead 2 pièces
- [x] Phase 13 : Hard drop trail intermédiaire
- [x] Phase 14 : Sons combo + back-to-back
- [x] Phase 15 : Particules améliorées (formes mixtes, burst directionnel)
- [x] Phase 16 : Screen shake au Tetris (4 lignes)

### Phase 16 — Détail
- Canvas shake 5px pendant 250ms quand 4 lignes cleared
- Getter pur shakeOffset (pas de mutation de state)
- _isShaking flag, expiration dans update()
- ctx.save/restore pour isoler le translate

### Tests
- [x] 100 tests Vitest — tous verts

### Reviews
- Kimi : getter avec effet de bord + sentinelle 0 → corrigé
- Test négatif ajouté (1 ligne ne shake pas)

### Commits (récents)
- 66c6a48 Screen shake au Tetris (4 lignes cleared)
- fec75ca Fix review : shake getter pur + expiration dans update()

### Blocage
Aucun

### Prochaine étape potentielle
- DAS configurable
- Thème dynamique basé sur le score/niveau
- Export stats / partage de score
