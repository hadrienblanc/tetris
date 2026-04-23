# CURRENT — Avancement Tetris

## Statut : Phase 89 complète (Versus AI — personas LLM)

### Fait
- [x] Phases 1-16 : Core, thèmes, AI, polish, hold, scoring, T-spin, labels, stats, effects
- [x] Phase 17-27 : Thème dynamique, effets, responsive, perf, GitHub Pages
- [x] Phase 28-37 : Touch, son thème, a11y, marathon, timer, particules, README, waveforms, leaderboard
- [x] Phase 38-44 : Particules game over, difficulté, persister, son, overlays, fix holdPiece
- [x] Phase 45-54 : Son par difficulté, combo display, leaderboard titre, reset, export JSON, download
- [x] Phase 55-59 : Bouton JSON, son combo/T-spin/B2B enrichis, preview/hold animées
- [x] Phase 60-68 : Sons B2B enrichi, high score HUD, tous sons difficulty-aware
- [x] Phase 69-73 : Particules lock, ghost dashed, border glow, spawn anim, lock flash
- [x] Phase 74-77 : README, sélecteur thème, labels colorés, thème persisté
- [x] Phase 78-79 : Queue 3 pièces, AI look-ahead 3-plies
- [x] Phase 80-82 : Responsive CSS, hard drop label, B2B streak counter
- [x] Phase 83 : Marathon best time par difficulté (leaderboard filtré, backward compat)
- [x] Phase 84 : Leaderboard top 5 par difficulté (pas global)
- [x] Phase 85 : Animation du compteur de score (interpolation exponentielle)
- [x] Phase 86 : Sons playMove/playRotate adaptés par difficulté
- [x] Phase 87 : Sons playDrop/playLock adaptés par difficulté (tous sons complets)
- [x] Phase 88 : Indicateur visuel vitesse AI (barre colorée vert→rouge)
- [x] Phase 89 : Versus AI — personas écrites par LLMs (Codex, GLM, Kimi, Gemini, MinMax)
  - `src/versus/personaHelpers.js` : primitives Tetris (ROTATIONS, simCollision, dropY, getHeights, countHoles, calcBumpiness, evaluateBasic, enumerateDrops)
  - `src/versus/personaRunner.js` : runner main-thread sync, sanitize cible, fallback baseline
  - `src/versus/baselineLogic.js` : baselineDecide El-Tetris 3-plies
  - `src/versus/personaMenu.js` : modale de choix AI1/AI2 + persistance localStorage
  - `src/versus/situationDetector.js` : FSM → 8 events de situation
  - `src/versus/personaBanter.js` : bulles au-dessus des boards, priorités, min-interval 8s
  - `src/personas/_baseline.js` : persona de référence El-Tetris
  - `tools/persona-prompt.md` : prompt canonique à copier dans chaque LLM

### Tests
- [x] 401 tests Vitest — tous verts

### En ligne
**https://hadrienblanc.github.io/tetris/**

### Commits (récents)
- 6e761ba Phase 88 : indicateur visuel vitesse AI
- fd439dc Fix : playBackToBack wave par difficulté (Kimi)
- 0170689 Phase 87 : sons playDrop/playLock par difficulté
- b550998 Phase 85 : animation du compteur de score

### Blocage
Aucun

### Prochaine étape potentielle
- Theme editor (custom colors)
- Canvas particle effects (sparkle on line clear)
- Animated background (subtle grid pulse)
- Mobile : swipe gesture sensitivity setting
