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

- [x] 10 thèmes : Néon, Clean, Pixel art, Vaporwave, Cyberpunk, Océan, Forêt, Sunset, Monochrome, Candy
- [x] Transition smooth entre thèmes (fade)
- [x] Timer automatique qui cycle tous les 10s

## Phase 3 — IA auto-play

- [x] Évaluation de board : hauteur, lignes, trous, bumpiness
- [x] Bouton toggle "AI Play" / "Manual"
- [x] L'AI joue de façon visible (pas instantanée)
- [x] Vitesse AI ajustable

## Phase 4 — Polish

- [x] Particules au clear de ligne
- [x] Sound design — Web Audio API synth + mute toggle
- [x] Responsive (mobile touch)
- [x] Ghost piece (shadow)

## Phase 5 — Hold + Lock delay + Pause

- [x] Hold piece (C/Shift)
- [x] Lock delay (500ms grâce, 15 resets max)
- [x] Pause (Échap/P) avec overlay, compensation lock delay

## Phase 6 — Scoring avancé

- [x] High score persisté (localStorage)
- [x] Animation flash au line clear (200ms)
- [x] Combo (bonus +50×combo×level)
- [x] Back-to-back (×1.5 pour Tetris consécutifs)

## Phase 7 — T-spin

- [x] Détection T-spin (3/4 coins + rotation)
- [x] Scoring : T-spin [400, 800, 1200, 1600] × level
- [x] T-spin = "difficult" pour back-to-back

## Phase 8 — Feedback visuel

- [x] Labels flottants T-SPIN! / COMBO ×n / BACK-TO-BACK!
- [x] Fondu + déplacement vertical sur 60 frames
- [x] Callbacks onTSpin, onCombo, onBackToBack

## Phase 9 — Stats de fin de partie

- [x] Tracking stats : pièces posées, T-spins, combo max
- [x] Son T-spin (playTSpin)
- [x] Overlay game over : score + stats détaillées

## Phase 10 — Animation line clear améliorée

- [x] Shrink vers le centre horizontal + fade-out
- [x] Flash blanc initial (30% de l'animation)
- [x] Getter clearProgress (0→1) déterministe

## Phase 11 — Hard drop trail

- [x] Traînée lumineuse au hard drop
- [x] Fade-out 150ms, getter trailProgress
- [x] Couleur sauvegardée avant lock/spawn

## Phase 12 — AI look-ahead 2 pièces

- [x] Simule toutes les positions de la pièce suivante
- [x] Score cumulé evaluate(board1) + max(evaluate(board2))
- [x] Fallback si aucune position valide pour la 2e pièce

## Phase 13 — Hard drop trail intermédiaire

- [x] Capture toutes les positions Y (échantillonnées toutes les 2 lignes)
- [x] Helper _currentCells() pour la capture

## Phase 14 — Sons combo + back-to-back

- [x] playCombo(n) : triangle montante proportionnelle
- [x] playBackToBack() : square ascendante rapide

## Phase 15 — Particules améliorées

- [x] Max 400 particules, 5-8 par cellule
- [x] Formes mixtes (ronds + carrés)
- [x] Burst directionnel vers le haut, gravité réduite, friction

## Phase 16 — Screen shake

- [x] Secousse du canvas (5px, 250ms) au Tetris (4 lignes)
- [x] Getter pur shakeOffset, _isShaking flag
- [x] ctx.save/restore pour isoler le translate

## Phase 17 — Thème dynamique par niveau

- [x] Thème change tous les 2 niveaux (floor((level-1)/2))
- [x] Timer 10s désactivé en mode niveau
- [x] onReset callback pour remettre le thème au restart

## Tests

- [x] Suite Vitest — 110 tests (pieces, game, AI, particles, themeManager)
