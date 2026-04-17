# CURRENT — Avancement Tetris

## Statut : Phase 18 complète (Flash level up)

### Fait
- [x] Phases 1-8 : Core, thèmes, AI, polish, hold, scoring, T-spin, labels
- [x] Phases 9-16 : Stats, shrink, trail, AI look-ahead 2, sons, particules, shake
- [x] Phase 17 : Thème dynamique par niveau
- [x] Phase 18 : Flash visuel au level up

### Phase 18 — Détail
- Pulse coloré (accent du thème) pendant 300ms au level up
- flashProgress getter pur, expiration dans update()
- Dessiné après ctx.restore() (pas affecté par le shake)

### Tests
- [x] 114 tests Vitest — tous verts

### Reviews
- Kimi : même pattern de mutation dans getter que shake → corrigé

### Commits (récents)
- 023a579 Flash visuel au level up
- da0e173 Fix review : flashProgress getter pur

### Blocage
Aucun

### Prochaine étape potentielle
- DAS configurable
- Export stats
- Responsive mobile amélioré
- Ambient effects par thème (rain, snow, bubbles)
