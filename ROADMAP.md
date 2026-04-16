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

1. **Néon** : glow, gradients sombres, grille lumineuse, cyan/magenta
2. **Clean** : flat, pastel, bordures fines, font moderne
3. **Pixel art** : rendu blocky, palette 8-bit, font retro
4. **Vaporwave** : roses, violets, marbre, grille perspective, aesthetic JPEG
5. **Cyberpunk** : jaune acide, noir profond, rain streaks, glitch effects
6. **Océan** : bleus profonds, bulles, reflets aquatiques, gradient marine
7. **Forêt** : verts organiques, texture bois, feuilles, palette nature
8. **Sunset** : oranges, roses, violets, gradient coucher de soleil
9. **Monochrome** : noir & blanc strict, contrastes forts, grain cinéma
10. **Candy** : couleurs pop acidulées, arrondis, brillance bonbon
- Système de transition smooth entre thèmes (fade / crossfade)
- Timer automatique qui cycle tous les 10s

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
