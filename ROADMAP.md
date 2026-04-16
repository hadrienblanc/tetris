# Tetris — Roadmap

## Stack

- **Vanilla JS + Vite + Canvas 2D**
- Pas de framework — game loop impératif (`requestAnimationFrame` + Canvas)
- Hot reload via Vite

---

## Phase 1 — Core game (MVP jouable)

- [x] Grille 10×20, rendu Canvas 2D
- [x] 7 tétriminos (I, O, T, S, Z, J, L) avec rotations (SRS)
- [x] Mouvements : gauche, droite, rotation, soft drop, hard drop
- [x] Collision detection, verrouillage des pièces, clear de lignes
- [x] Gravité avec speed-up par niveau
- [x] Score, niveau, lignes cleared, next piece preview
- [x] Controls clavier (flèches + espace)

## Phase 2 — Thèmes visuels (rotation toutes les 10s)

- [x] 1. **Néon** : glow, gradients sombres, grille lumineuse, cyan/magenta
- [x] 2. **Clean** : flat, pastel, bordures fines, font moderne
- [x] 3. **Pixel art** : rendu blocky, palette 8-bit, font retro
- [x] 4. **Vaporwave** : roses, violets, marbre, grille perspective, aesthetic JPEG
- [x] 5. **Cyberpunk** : jaune acide, noir profond, rain streaks, glitch effects
- [x] 6. **Océan** : bleus profonds, bulles, reflets aquatiques, gradient marine
- [x] 7. **Forêt** : verts organiques, texture bois, feuilles, palette nature
- [x] 8. **Sunset** : oranges, roses, violets, gradient coucher de soleil
- [x] 9. **Monochrome** : noir & blanc strict, contrastes forts, grain cinéma
- [x] 10. **Candy** : couleurs pop acidulées, arrondis, brillance bonbon
- [x] Système de transition smooth entre thèmes (fade / crossfade)
- [x] Timer automatique qui cycle tous les 10s

## Phase 3 — IA auto-play

- [x] Évaluation de board : hauteur agrégée, lignes complètes, trous, bumpiness
- [x] Bouton toggle "AI Play" / "Manual"
- [x] L'AI joue de façon visible (pas instantanée)
- [x] Vitesse AI ajustable

## Phase 4 — Polish

- [ ] Particules / effets au clear de ligne
- [ ] Sound design (optionnel)
- [ ] Responsive (mobile touch)
- [ ] Ghost piece (shadow de la pièce en bas) *(déjà implémenté)*
