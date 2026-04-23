// Tournoi headless round-robin parallélisé (worker_threads).
// Usage : node tools/tournament.js [--matches 20] [--workers auto]
//
// - Charge toutes les src/personas/*.js qui exportent `persona`.
// - Pour chaque paire (A, B), joue `matches` matchs (moitié A à gauche,
//   moitié A à droite pour neutraliser le biais de côté).
// - Même `seedIndex` pour toutes les paires → équité de loterie de pièces.
// - Parallélisé sur `workers` threads.

import { readdirSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PERSONAS_DIR = path.join(PROJECT_ROOT, 'src', 'personas');
const WORKER_PATH = path.join(__dirname, 'tournament-worker.js');

// ─── Config ─────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
function argValue(name) {
  const i = argv.indexOf(name);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined;
}
const MATCHES_PER_PAIR = parseInt(argValue('--matches')) || 20;
const WORKERS_ARG = argValue('--workers');
const NUM_WORKERS = WORKERS_ARG && WORKERS_ARG !== 'auto'
  ? parseInt(WORKERS_ARG)
  : Math.max(1, (availableParallelism?.() || 4) - 2);
const MAX_PIECES = 250;
const MAX_DURATION_MS = 90_000;
const TICK_MS = 16;

// ─── Chargement des métadonnées persona (main thread) ───────────────────
async function loadPersonaMetas() {
  const files = readdirSync(PERSONAS_DIR).filter(f => f.endsWith('.js')).sort();
  const metas = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(path.join(PERSONAS_DIR, f)).href);
    if (mod.persona && typeof mod.persona.decide === 'function') {
      metas.push({ file: f, name: mod.persona.name || f.replace(/\.js$/, '') });
    }
  }
  return metas;
}

// ─── Pool de workers ────────────────────────────────────────────────────
function runJobsWithPool(jobs, workerCount) {
  return new Promise((resolve, reject) => {
    const workerData = {
      personasDir: PERSONAS_DIR,
      maxPieces: MAX_PIECES,
      maxDurationMs: MAX_DURATION_MS,
      tickMs: TICK_MS,
    };
    const workers = Array.from({ length: workerCount }, () => new Worker(WORKER_PATH, { workerData }));
    const results = new Array(jobs.length);
    let remaining = jobs.length;
    let cursor = 0;
    let errored = false;

    function feed(worker) {
      if (errored) return;
      if (cursor >= jobs.length) {
        // Plus de travail pour ce worker, on le termine proprement
        worker.terminate();
        return;
      }
      const id = cursor++;
      const job = { ...jobs[id], id };
      worker.postMessage(job);
    }

    for (const w of workers) {
      w.on('message', (msg) => {
        if (!msg.ok) {
          errored = true;
          reject(new Error(`Worker error: ${msg.error}`));
          for (const ww of workers) ww.terminate();
          return;
        }
        results[msg.id] = msg.res;
        remaining--;
        const pct = ((jobs.length - remaining) / jobs.length * 100).toFixed(0);
        if (remaining % 5 === 0 || remaining === 0) {
          process.stderr.write(`\r[${pct}%] ${jobs.length - remaining}/${jobs.length} matchs…`);
        }
        if (remaining === 0) {
          for (const ww of workers) ww.terminate();
          resolve(results);
        } else {
          feed(w);
        }
      });
      w.on('error', (e) => {
        if (errored) return;
        errored = true;
        reject(e);
      });
      feed(w);
    }
  });
}

// ─── Agrégation ─────────────────────────────────────────────────────────
function aggregate(personas, jobs, results) {
  const stats = new Map();
  for (const p of personas) {
    stats.set(p.file, {
      name: p.name, file: p.file,
      wins: 0, losses: 0, ties: 0,
      scoreSum: 0, leadSum: 0, piecesSum: 0, games: 0,
      h2h: new Map(),
    });
  }

  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i];
    const r = results[i];
    const sA = stats.get(j.fileA);
    const sB = stats.get(j.fileB);
    if (!sA.h2h.has(j.fileB)) sA.h2h.set(j.fileB, { wins: 0, losses: 0, ties: 0 });
    if (!sB.h2h.has(j.fileA)) sB.h2h.set(j.fileA, { wins: 0, losses: 0, ties: 0 });

    sA.games++; sB.games++;
    sA.scoreSum += r.scoreA; sB.scoreSum += r.scoreB;
    sA.leadSum += r.leadTimeA; sB.leadSum += r.leadTimeB;
    sA.piecesSum += r.piecesA; sB.piecesSum += r.piecesB;

    if (r.winner === 'A')      { sA.wins++;  sB.losses++; sA.h2h.get(j.fileB).wins++;   sB.h2h.get(j.fileA).losses++; }
    else if (r.winner === 'B') { sB.wins++;  sA.losses++; sB.h2h.get(j.fileA).wins++;   sA.h2h.get(j.fileB).losses++; }
    else                       { sA.ties++;  sB.ties++;   sA.h2h.get(j.fileB).ties++;   sB.h2h.get(j.fileA).ties++; }
  }

  return stats;
}

// ─── Rendu ──────────────────────────────────────────────────────────────
function renderRanking(stats, totalMatches) {
  const rows = [...stats.values()];
  rows.sort((a, b) => {
    const wrA = a.wins / (a.games || 1);
    const wrB = b.wins / (b.games || 1);
    if (wrA !== wrB) return wrB - wrA;
    if (a.scoreSum !== b.scoreSum) return b.scoreSum - a.scoreSum;
    return b.leadSum - a.leadSum;
  });
  const out = [];
  out.push('# Tournoi Versus AI');
  out.push('');
  out.push(`- **Matchs par paire** : ${MATCHES_PER_PAIR}`);
  out.push(`- **Total matchs** : ${totalMatches}`);
  out.push('');
  out.push('## Classement');
  out.push('');
  out.push('| # | Persona | W | L | T | Win% | Score moy | Lead moy (s) | Pièces moy |');
  out.push('|---|---|---|---|---|---|---|---|---|');
  rows.forEach((r, i) => {
    const winRate = ((r.wins / (r.games || 1)) * 100).toFixed(1);
    const avgScore = Math.round(r.scoreSum / (r.games || 1));
    const avgLead = (r.leadSum / (r.games || 1) / 1000).toFixed(1);
    const avgPieces = Math.round(r.piecesSum / (r.games || 1));
    out.push(`| ${i + 1} | ${r.name} | ${r.wins} | ${r.losses} | ${r.ties} | ${winRate}% | ${avgScore} | ${avgLead} | ${avgPieces} |`);
  });
  out.push('');
  out.push('## Matrice des confrontations');
  out.push('');
  out.push('Lecture : ligne X contre colonne Y → victoires de X sur Y / total.');
  out.push('');
  const cols = rows.map(r => r.name);
  out.push('| ↓ vs → | ' + cols.join(' | ') + ' |');
  out.push('|---|' + cols.map(() => '---').join('|') + '|');
  for (const a of rows) {
    const cells = rows.map(b => {
      if (a.file === b.file) return '—';
      const h = a.h2h.get(b.file);
      if (!h) return '—';
      const total = h.wins + h.losses + h.ties;
      if (total === 0) return '—';
      const pct = ((h.wins / total) * 100).toFixed(0);
      return `${h.wins}/${total} (${pct}%)`;
    });
    out.push(`| **${a.name}** | ${cells.join(' | ')} |`);
  }
  out.push('');
  return out.join('\n');
}

function renderJson(stats) {
  const arr = [...stats.values()].map(r => ({
    name: r.name, file: r.file,
    wins: r.wins, losses: r.losses, ties: r.ties, games: r.games,
    winRate: +(r.wins / (r.games || 1)).toFixed(4),
    avgScore: Math.round(r.scoreSum / (r.games || 1)),
    avgLeadMs: Math.round(r.leadSum / (r.games || 1)),
    avgPieces: Math.round(r.piecesSum / (r.games || 1)),
    h2h: Object.fromEntries(r.h2h),
  }));
  return { matchesPerPair: MATCHES_PER_PAIR, timestamp: new Date().toISOString(), ranking: arr };
}

// ─── Main ───────────────────────────────────────────────────────────────
async function main() {
  const personas = await loadPersonaMetas();
  if (personas.length < 2) {
    console.error('Au moins 2 personas requises dans src/personas/.');
    process.exit(1);
  }

  // Construit tous les jobs : pour chaque paire, MATCHES_PER_PAIR matchs,
  // moitié A en gauche, moitié A en droite.
  const jobs = [];
  for (let i = 0; i < personas.length; i++) {
    for (let j = i + 1; j < personas.length; j++) {
      for (let m = 0; m < MATCHES_PER_PAIR; m++) {
        jobs.push({
          fileA: personas[i].file,
          fileB: personas[j].file,
          seedIndex: m,
          aLeft: m < MATCHES_PER_PAIR / 2,
        });
      }
    }
  }

  console.error(`Personas (${personas.length}) : ${personas.map(p => p.name).join(', ')}`);
  console.error(`Jobs : ${jobs.length} matchs × ${NUM_WORKERS} workers parallèles.`);

  const start = Date.now();
  const results = await runJobsWithPool(jobs, NUM_WORKERS);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  process.stderr.write(`\r✓ ${jobs.length} matchs en ${elapsed}s (${(jobs.length / elapsed).toFixed(1)} matchs/s)\n`);

  const stats = aggregate(personas, jobs, results);
  const markdown = renderRanking(stats, jobs.length);
  const json = renderJson(stats);

  writeFileSync(path.join(PROJECT_ROOT, 'tournament-results.json'), JSON.stringify(json, null, 2));
  writeFileSync(path.join(PROJECT_ROOT, 'TOURNAMENT.md'), markdown);
  console.log(markdown);
  console.error('\n→ tournament-results.json + TOURNAMENT.md écrits.');
}

main().catch(e => { console.error(e); process.exit(1); });
