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

- [x] Particules / effets au clear de ligne
- [x] Sound design — Web Audio API synth (move, rotate, drop, clear, level up, game over) + mute toggle
- [x] Responsive (mobile touch)
- [x] Ghost piece (shadow de la pièce en bas)

## Phase 5 — Hold + Lock delay + Pause

- [x] Hold piece (C/Shift pour stocker/échanger)
- [x] Lock delay (500ms grâce, 15 resets max)
- [x] Pause (Échap/P) avec overlay, blocage actions, compensation lock delay

## Phase 6 — Scoring avancé

- [x] High score persisté (localStorage)
- [x] Animation flash blanc au line clear (200ms)
- [x] Combo (bonus +50×combo×level par clear consécutif)
- [x] Back-to-back (×1.5 pour Tetris consécutifs)

## Phase 7 — T-spin

- [x] Détection T-spin (3/4 coins diagonaux occupés + dernière action = rotation)
- [x] Scoring : T-spin 0-ligne=400, single=800, double=1200, triple=1600 × level
- [x] T-spin compte comme "difficult" pour back-to-back
- [x] holdPiece et spawn reset le flag rotation

## Phase 8 — Feedback visuel

- [x] Labels flottants T-SPIN! / COMBO ×n / BACK-TO-BACK! sur le canvas
- [x] Fondu + déplacement vertical sur 60 frames
- [x] Callbacks onTSpin, onCombo, onBackToBack testables

## Tests

- [x] Suite Vitest — 74 tests (pieces, game, AI, particles)
