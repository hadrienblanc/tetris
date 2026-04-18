// Mulberry32 — PRNG seedable, rapide, suffisant pour du shuffle non-cryptographique.
// Permet d'avoir deux séquences de pièces indépendantes (versus P1/P2).

export function mulberry32(seed) {
  let t = (seed >>> 0) || 1;
  return function rand() {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
