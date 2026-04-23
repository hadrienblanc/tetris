# Prompt canonique — générer une persona Tetris

Ce prompt est à **copier-coller dans un LLM** (Codex, GLM, Gemini, Kimi, MinMax, Claude…) pour obtenir un fichier JS de persona prêt à déposer dans `src/personas/`.

Remplace `{{MODEL_NAME}}` par le nom court à afficher en jeu (ex. `Codex`, `GLM 5.1`).

---

## Le prompt

```
Tu vas écrire une persona pour un mode "Versus AI" d'un Tetris JS.

## Règle du jeu
- Grille 10 colonnes × 20 lignes.
- 7 pièces (I, O, T, S, Z, J, L) tirées dans un "bag" mélangé.
- Chaque clear envoie des points ; 4 lignes d'un coup = Tetris (bonus).
- Score visible des deux côtés. Celui qui mène le plus longtemps cumulé gagne.
- Deux personas s'affrontent. Chacune décide où poser SA pièce.

## Ton livrable
Un SEUL fichier JS, format module ES :

```js
// src/personas/{{MODEL_NAME}}.js
import { ROTATIONS } from '../pieces.js';
import {
  COLS, ROWS,
  cloneBoard, simLock, simClearLines, simCollision,
  dropY, getHeights, countHoles, calcBumpiness,
  evaluateBasic, getUniqueRotations, enumerateDrops,
  ELTETRIS_WEIGHTS,
} from '../versus/personaHelpers.js';

export const persona = {
  name: '{{MODEL_NAME}}',
  banter: {
    MATCH_START: [/* … */],
    TAKE_LEAD:   [/* … */],
    LOSE_LEAD:   [/* … */],
    DOMINATING:  [/* … */],
    TRAILING:    [/* … */],
    CLOSE:       [/* … */],
    COMEBACK:    [/* … */],
    VICTORY:     [/* … */],
    DEFEAT:      [/* … */],
  },
  decide(state) {
    // … ton algorithme ici
    return { rotation, x };
  },
};
```

## Signature de decide(state)

`state` contient tout ce que tu peux observer :

```ts
state = {
  board,      // Array<Array<string|null>>  20 lignes × 10 colonnes, null = vide
  current: { name, rotation, x, y, id },   // ta pièce actuelle
  next:    { name },                        // prochaine (ou null)
  queue:   [{ name }, { name }],            // les 2 suivantes
  hold:    { name } | null,                 // pièce en hold
  canHold: boolean,
  self: { score, level, lines, combo, b2bStreak, leadTime },
  opp:  { score, level, lines, combo, b2bStreak, leadTime },
}
```

Ton retour doit être `{ rotation: 0|1|2|3, x: integer }`.
- `rotation` = index dans `ROTATIONS[current.name]` (0 à 3).
- `x` ∈ [-2, 9] inclus. Les I horizontales légitimes vont jusqu'à x=-2 (shape déborde à gauche mais pas les cellules 1), les I verticales peuvent atteindre x=9. Au-delà = rejeté.
- **Ne mute pas `state`** (board, current, etc.). Si tu as besoin de simuler, `cloneBoard(state.board)` d'abord. Une mutation polluera le vrai jeu des frames suivantes.

Si tu renvoies n'importe quoi (NaN, Infinity, rotation négative, x hors plage, ou tu jettes), le moteur fallback sur une heuristique baseline — donc mieux vaut échouer clean qu'inventer.

**Hold est en lecture seule.** Tu peux observer `state.hold` et `state.canHold` pour évaluer ta situation, mais le moteur n'exécute PAS d'action hold — même si tu renvoies `useHold: true`, c'est ignoré. Prends tes décisions avec la pièce `current` seule.

## Helpers disponibles (tous importés depuis `../versus/personaHelpers.js`)

- `COLS = 10`, `ROWS = 20`
- `ROTATIONS[name][rot]` → shape 2D (0/1)
- `cloneBoard(board)` → deep copy
- `simCollision(board, shape, x, y)` → bool
- `dropY(board, shape, x)` → ligne du lock si hard-dropped à cette colonne
- `simLock(board, shape, x, y, name)` → mute board in-place
- `simClearLines(board)` → int : nb lignes effacées (mute in-place)
- `getHeights(board)` → Array(10), hauteur par colonne
- `countHoles(board)` → int
- `calcBumpiness(heights)` → int : somme des |h[i]-h[i+1]|
- `evaluateBasic(board, linesCleared)` → float : score El-Tetris standard. Convention : le board a DÉJÀ été clearé et linesCleared passé en 2e arg.
- `getUniqueRotations(name)` → Array<int> : rotations à tester (O n'en a qu'1)
- `enumerateDrops(board, pieceName)` → Array<{ rotation, x, y, board, linesCleared }> : raccourci pour énumérer tous les placements possibles
- `ELTETRIS_WEIGHTS` = { height: -0.51, lines: 0.76, holes: -0.36, bumpiness: -0.18 }

## Les 9 events de banter

Chaque array contient 1-5 phrases courtes (≤ 60 chars). Le moteur en pioche une au hasard quand l'event se déclenche.

| Event | Quand | Qui parle |
|---|---|---|
| `MATCH_START` | Début de match | toi (AI1) |
| `TAKE_LEAD`   | Tu prends l'avance | le nouveau leader |
| `LOSE_LEAD`   | Tu te fais doubler | celui qui chute |
| `DOMINATING`  | 30s+ de lead ininterrompu | le leader |
| `TRAILING`    | 30s+ dans l'ombre | le suiveur |
| `CLOSE`       | Scores proches depuis 15s+ | neutre (un des deux) |
| `COMEBACK`    | Tu reviens après 20s+ de trail | le revenant |
| `VICTORY`     | Fin de match, t'as gagné | toi |
| `DEFEAT`      | Fin de match, t'as perdu | toi |

## Consignes stylistiques (banter)

- Invente une personnalité cohérente pour ton modèle. Sois identifiable.
- Une persona `Kimi exubérant` ≠ une persona `Codex stoïque` ≠ une persona `GLM taquin`.
- Français ou anglais, à toi de voir selon le ton.
- Pas d'émoji imposé, mais autorisé.
- Court et percutant — pas de paragraphes.

## Contraintes techniques dures

- Le fichier doit être un module ES valide (testé par `node --check`).
- `decide()` doit retourner en moins de quelques ms (pas de réseau, pas de setTimeout, pas de I/O — tout est sync main thread).
- Pas de dépendance externe au-delà des imports listés.
- Pas de code de test, pas de fichier annexe : **un seul fichier JS**.

## Livrable attendu

Rends UNIQUEMENT le bloc de code JS du fichier (```js … ```), sans préambule ni explications.
```

---

## Après avoir reçu la réponse

1. Copie le bloc JS dans `src/personas/{{model-name}}.js` (kebab-case).
2. Lance `npm test` — si ça casse un test existant, le LLM a triché (import interdit, side-effect, etc.) → régénère.
3. Lance `npm run dev`, ouvre le mode Versus, et fais-la combattre Baseline.
4. Commit le fichier une fois la persona jouable.

## Conseil

Les LLMs sont mauvais en raisonnement spatial pur. Les meilleurs résultats viennent quand ils **réutilisent `enumerateDrops` + `evaluateBasic`** avec des poids custom ou une évaluation augmentée (pénalités de trous profonds, bonus de T-spin setup, look-ahead 2/3 plies). Un LLM qui essaie de calculer à la main des collisions va galérer.
