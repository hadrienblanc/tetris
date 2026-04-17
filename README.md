# Tetris

Jeu Tetris en vanilla JavaScript avec Canvas 2D, 10 thèmes visuels, mode marathon et IA automatique.

**Démo : [hadrienblanc.github.io/tetris](https://hadrienblanc.github.io/tetris/)**

## Fonctionnalités

- **10 thèmes visuels** : Néon, Clean, Pixel Art, Vaporwave, Cyberpunk, Océan, Forêt, Sunset, Monochrome, Candy
- **IA auto-play** (El-Tetris, look-ahead 2 pièces, vitesse ajustable)
- **Mode marathon** : effacer 40 lignes pour gagner, chronomètre, meilleur temps persisté
- **Sons synthétisés** via Web Audio API (pitch + waveform uniques par thème)
- **Particules** : explosions de ligne, feux d'artifice de victoire
- **Effets visuels** : ghost piece, hard drop trail, screen shake, flash level-up, ambient background
- **Scoring avancé** : T-spin, combo, back-to-back, high score localStorage
- **Contrôles tactiles** avancés (tap, swipe, 2 doigts)
- **Accessibilité** : ARIA labels, aria-live announcer, focus visible
- **Responsive** (mobile + desktop)
- **191 tests** Vitest

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
