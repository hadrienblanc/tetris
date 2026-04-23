// Worker thread pour le tournoi. Reçoit des jobs de match et renvoie les résultats.
// Charge les personas au démarrage, puis simule chaque match à la demande.

import { parentPort, workerData } from 'node:worker_threads';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

import { Game } from '../src/game.js';
import { PersonaRunner } from '../src/versus/personaRunner.js';
import { mulberry32 } from '../src/rng.js';

const { personasDir, maxPieces, maxDurationMs, tickMs } = workerData;

// Cache local des modules persona (chargés paresseusement à la première utilisation).
const personaCache = new Map();
async function getPersona(fileName) {
  if (!personaCache.has(fileName)) {
    const fullPath = path.join(personasDir, fileName);
    const mod = await import(pathToFileURL(fullPath).href);
    personaCache.set(fileName, mod.persona);
  }
  return personaCache.get(fileName);
}

function simulateMatch(personaA, personaB, seedIndex, aLeft) {
  const seedA = (0x9e3779b9 ^ (seedIndex * 2654435761)) >>> 0;
  const seedB = (seedA ^ 0x85ebca6b) >>> 0;

  const gameA = new Game({
    marathonTarget: 0, persistScores: false, levelCap: Infinity,
    rng: mulberry32(seedA), difficulty: 'normal',
  });
  const gameB = new Game({
    marathonTarget: 0, persistScores: false, levelCap: Infinity,
    rng: mulberry32(seedB), difficulty: 'normal',
  });
  gameA.start(); gameB.start();

  const sideA = { game: gameA, leadTime: 0 };
  const sideB = { game: gameB, leadTime: 0 };
  const leftPersona  = aLeft ? personaA : personaB;
  const rightPersona = aLeft ? personaB : personaA;
  const aiA = new PersonaRunner(leftPersona,  sideA, () => sideB);
  const aiB = new PersonaRunner(rightPersona, sideB, () => sideA);
  aiA.active = true; aiB.active = true;
  aiA.setSpeed(0); aiB.setSpeed(0);

  let t = 0, lastTick = 0;
  let leadTimeA = 0, leadTimeB = 0;
  let prevScoreA = 0, prevScoreB = 0;

  while ((!gameA.gameOver || !gameB.gameOver)
         && t < maxDurationMs
         && gameA.stats.pieces < maxPieces
         && gameB.stats.pieces < maxPieces) {
    t += tickMs;
    const dt = t - lastTick;
    if (!gameA.gameOver && !gameB.gameOver && dt > 0) {
      if (prevScoreA > prevScoreB) leadTimeA += dt;
      else if (prevScoreB > prevScoreA) leadTimeB += dt;
    }
    lastTick = t;
    if (!gameA.gameOver && gameA.clearingRows.length === 0) aiA.update(t);
    if (!gameB.gameOver && gameB.clearingRows.length === 0) aiB.update(t);
    if (!gameA.gameOver) gameA.update(t);
    if (!gameB.gameOver) gameB.update(t);
    prevScoreA = gameA.score;
    prevScoreB = gameB.score;
  }

  // Repli côté A/B (indépendant du côté physique)
  const leftWinnerToLogical = (leadTimeA > leadTimeB) ? 'left' : (leadTimeB > leadTimeA ? 'right' : 'tie');
  const winner = leftWinnerToLogical === 'tie' ? 'TIE'
               : (leftWinnerToLogical === 'left' ? (aLeft ? 'A' : 'B') : (aLeft ? 'B' : 'A'));

  return {
    winner,
    scoreA:    aLeft ? gameA.score : gameB.score,
    scoreB:    aLeft ? gameB.score : gameA.score,
    leadTimeA: aLeft ? leadTimeA   : leadTimeB,
    leadTimeB: aLeft ? leadTimeB   : leadTimeA,
    piecesA:   aLeft ? gameA.stats.pieces : gameB.stats.pieces,
    piecesB:   aLeft ? gameB.stats.pieces : gameA.stats.pieces,
    duration: t,
  };
}

parentPort.on('message', async (job) => {
  try {
    const pA = await getPersona(job.fileA);
    const pB = await getPersona(job.fileB);
    const res = simulateMatch(pA, pB, job.seedIndex, job.aLeft);
    parentPort.postMessage({ id: job.id, ok: true, res });
  } catch (e) {
    parentPort.postMessage({ id: job.id, ok: false, error: e.message || String(e) });
  }
});
