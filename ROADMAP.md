# Tetris — Roadmap

## Stack

- **Vanilla JS + Vite + Canvas 2D**
- Pas de framework — game loop impératif (`requestAnimationFrame` + Canvas)
- Hot reload via Vite

---

## Phase 1 — Core game (MVP jouable)

- Grille 10×20, rendu Canvas 2D
- 7 tétriminos (I, O, T, S, Z, J, L) avec rotations (SRS)
- Mouvements : gauche, droite, rotation, soft drop, hard drop
- Collision detection, verrouillage des pièces, clear de lignes
- Gravité avec speed-up par niveau
- Score, niveau, lignes cleared, next piece preview
- Controls clavier (flèches + espace)

## Phase 2 — Thèmes visuels (rotation toutes les 10s)

- **Néon** : glow, gradients sombres, grille lumineuse
- **Clean** : flat, pastel, bordures fines, font moderne
- **Pixel art** : rendu blocky, palette 8-bit, font retro
- Système de transition smooth entre thèmes (fade / crossfade)
- Timer automatique qui cycle

## Phase 3 — IA auto-play

- Évaluation de board : hauteur agrégée, lignes complètes, trous, bumpiness
- Bouton toggle "AI Play" / "Manual"
- L'AI joue de façon visible (pas instantanée)
- Vitesse AI ajustable

## Phase 4 — Polish

- Particules / effets au clear de ligne
- Sound design (optionnel)
- Responsive (mobile touch)
- Ghost piece (shadow de la pièce en bas)
