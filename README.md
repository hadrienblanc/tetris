# Tetris

Jeu Tetris en vanilla JavaScript avec Canvas 2D, 10 thèmes visuels, mode marathon, difficulté sélectionnable et IA automatique.

**Démo : [hadrienblanc.github.io/tetris](https://hadrienblanc.github.io/tetris/)**

## Fonctionnalités

- **10 thèmes visuels** : Néon, Clean, Pixel Art, Vaporwave, Cyberpunk, Océan, Forêt, Sunset, Monochrome, Candy
- **3 niveaux de difficulté** : Facile, Normal, Difficile (vitesse de chute + multiplicateur de score)
- **IA auto-play** (El-Tetris, look-ahead 3 pièces, vitesse ajustable)
- **Mode marathon** : effacer 40 lignes pour gagner, chronomètre, leaderboard local (top 5)
- **Sons synthétisés** via Web Audio API (pitch + waveform uniques par thème, tous les sons événements adaptés à la difficulté)
- **Particules** : explosions de ligne, feux d'artifice de victoire, explosion sombre game over, bursts combo dorés, burst de verrouillage
- **Effets visuels** : ghost piece (outline dashed), hard drop trail (coloré par thème), screen shake, flash level-up, lock flash, spawn animation (scale-in), border glow, ambient background, combo display, preview/hold animées
- **Scoring avancé** : T-spin, combo, back-to-back, high score localStorage
- **Contrôles tactiles** avancés (tap, swipe, 2 doigts)
- **Accessibilité** : ARIA labels, aria-live announcer, focus visible
- **Responsive** (mobile + desktop)
- **244 tests** Vitest

## Contrôles

| Touche | Action |
|--------|--------|
| ← → | Déplacer |
| ↑ | Tourner |
| Espace | Hard drop |
| C / Shift | Hold |
| P / Échap | Pause |
| R | Rejouer (game over) |

### Tactile

- Tap centre : tourner
- Tap côtés : déplacer
- Swipe bas : hard drop
- Swipe haut long : hold
- 2 doigts : hard drop

## AI Tournament

Each LLM available on the dev machine (GPT-5.5, GLM 5.1, Gemini 2.5, Kimi K2.6, MiniMax M2.7, Claude Opus 4.7) was given the same prompt (`tools/persona-prompt.md`) and asked to write its own JavaScript Tetris strategy. A headless round-robin tournament (`tools/tournament.js`) then ran **20 matches per pair** in parallel across 22 workers — 420 matches, 11m25s wall clock on a Ryzen AI 9 HX 370.

| # | Persona | W / L | Win rate | Avg score | Avg lead |
|---|---|---|---|---|---|
| 🥇 | **Gemini 2.5** | 95 / 25 | **79.2 %** | 72 236 | 26.5 s |
| 🥈 | **Kimi K2.6** | 86 / 34 | 71.7 % | 73 895 | 25.6 s |
| 🥉 | **GPT-5.5** | 70 / 50 | 58.3 % | 71 893 | 22.5 s |
| 4 | GLM 5.1 | 60 / 60 | 50.0 % | 70 688 | 19.6 s |
| 5 | Claude Opus 4.7 | 50 / 70 | 41.7 % | 69 831 | 18.0 s |
| 6 | MiniMax M2.7 | 36 / 84 | 30.0 % | 67 813 | 15.3 s |
| 7 | Baseline El-Tetris (Dellacherie 2009) | 23 / 97 | 19.2 % | 66 022 | 11.0 s |

Full head-to-head matrix in [`TOURNAMENT.md`](./TOURNAMENT.md).

### Reading the results

- **Gemini dominates without contest** — over 70 % against every opponent, 95 % against MiniMax and Baseline. Its strategy file is shorter than GPT-5.5's, but its weights land better.
- **Kimi is a solid second** — only really loses to Gemini (30 %).
- **Gemini vs Kimi**: 14/20 for Gemini (70 %) — a clear gap.
- **Baseline is the floor** at 19.2 %. Pure El-Tetris with the classic four weights isn't competitive anymore once opponents add hole-depth penalty, wells, landing height, or row/column transitions.
- **Claude Opus 4.7** (mid-pack, 41.7 %) beats Baseline and MiniMax comfortably but gets pushed around by Gemini and Kimi. The `holeDepth = -0.04` weight is likely too aggressive — punishing deep wells hurts the setups that enable a Tetris.

### Surprises

- **GPT-5.5 loses to Kimi** (9/20, 45 %) despite a much richer evaluation (column/row transitions + landing height + quadratic wells + anti-skim penalty + right-well Tetris detection). More features ≠ better tuning.
- **MiniMax with a 3-ply lookahead is near the bottom** — it only beats Baseline (70 %). Depth doesn't compensate for weak heuristics.
- **Variance is low** at 20 matches per pair: most matchups stabilize within ±10 % of the 50/50 line, which suggests the ranking reflects real skill rather than luck.

### Reproducing

```bash
node tools/tournament.js --matches 20          # ~11 min on 22 workers
node tools/tournament.js --matches 10          # ~6 min, still readable
node tools/tournament.js --workers 4           # fewer threads, more background-friendly
```

Output: `TOURNAMENT.md` (ranking + matrix) and `tournament-results.json` (raw data).

## Stack

- Vanilla JavaScript (ES modules)
- Canvas 2D
- Vite
- Vitest

## Développement

```bash
npm install
npm run dev
npm test
npm run build
```

## Déploiement

GitHub Actions → GitHub Pages (branche `master` → `/tetris/`).

## Licence

MIT
