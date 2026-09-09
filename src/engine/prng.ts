/**
 * Park–Miller LCG — same family as Platen `makePRNG` in platen-core.js
 * so seeds stay conceptually compatible when real engines land.
 */
const P = 2147483647;

export interface PRNG {
  next(): number;
  /** Float in [a, b). */
  rfl(a?: number, b?: number): number;
  /** Inclusive integer in [a, b]. */
  rin(a: number, b: number): number;
}

export function makePRNG(seed: number): PRNG {
  let t = seed % P;
  if (t <= 0) t += P;

  function next(): number {
    t = (t * 16807) % P;
    return t;
  }

  return {
    next,
    rfl(a = 0, b = 1) {
      return ((next() - 1) / (P - 1)) * (b - a) + a;
    },
    rin(a, b) {
      return a + (next() % (b - a + 1));
    },
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000);
}

export function clampSeed(value: number): number {
  if (!Number.isFinite(value)) return 1;
  const n = Math.trunc(value);
  if (n <= 0) return 1;
  return n % P || 1;
}
