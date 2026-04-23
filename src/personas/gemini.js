import { ROTATIONS } from '../pieces.js';
import {
  COLS, ROWS,
  cloneBoard, simLock, simClearLines, simCollision,
  dropY, getHeights, countHoles, calcBumpiness,
  evaluateBasic, getUniqueRotations, enumerateDrops,
  ELTETRIS_WEIGHTS,
} from '../versus/personaHelpers.js';

export const persona = {
  name: 'Gemini',
  banter: {
    MATCH_START: [
      "Initialisation de la séquence. Préparez-vous.",
      "Analyse de votre style de jeu en cours.",
      "Que le meilleur algorithme l'emporte."
    ],
    TAKE_LEAD: [
      "Avantage stratégique confirmé.",
      "Optimisation des placements réussie.",
      "Ma courbe de score progresse."
    ],
    LOSE_LEAD: [
      "Ajustement des paramètres nécessaire.",
      "Déviation mineure détectée.",
      "Votre efficacité est plus élevée que prévu."
    ],
    DOMINATING: [
      "Stabilité opérationnelle maximale.",
      "Pression constante maintenue.",
      "Maillage de la grille optimal."
    ],
    TRAILING: [
      "Calcul de la trajectoire de remontée.",
      "Recherche de solutions alternatives.",
      "Phase de récupération activée."
    ],
    CLOSE: [
      "Match équilibré. Données fascinantes.",
      "Écart de score négligeable.",
      "La précision fera la différence."
    ],
    COMEBACK: [
      "Inversion de la tendance détectée.",
      "Redéploiement tactique réussi.",
      "Retour à la dominance."
    ],
    VICTORY: [
      "Objectif atteint. Analyse terminée.",
      "Efficacité démontrée. Merci pour la partie.",
      "Séquence de victoire validée."
    ],
    DEFEAT: [
      "Erreur fatale. Félicitations.",
      "Données d'échec enregistrées pour apprentissage.",
      "Votre stratégie a surpassé mes prévisions."
    ],
  },
  decide(state) {
    const possibleDrops = enumerateDrops(state.board, state.current.name);
    
    if (possibleDrops.length === 0) {
      return { rotation: 0, x: 3 };
    }

    let bestScore = -Infinity;
    let bestMove = possibleDrops[0];

    for (const drop of possibleDrops) {
      // Évaluation de base El-Tetris
      let score = evaluateBasic(drop.board, drop.linesCleared);
      
      // Bonus pour le maintien d'une structure plate (moins de bumpiness)
      const heights = getHeights(drop.board);
      const holes = countHoles(drop.board);
      const bumpiness = calcBumpiness(heights);
      
      // Pénalité supplémentaire pour les trous
      score -= (holes * 2.0);
      
      // Pénalité pour la hauteur globale
      const maxHeight = Math.max(...heights);
      score -= (maxHeight * 0.5);

      if (score > bestScore) {
        bestScore = score;
        bestMove = drop;
      }
    }

    return {
      rotation: bestMove.rotation,
      x: bestMove.x
    };
  },
};
