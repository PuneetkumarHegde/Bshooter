/**
 * rng.js — Small, fast, SEEDED pseudo-random generator (mulberry32).
 *
 * Seeding by level number makes level generation deterministic: the same level
 * always produces the same board, so "Restart" restores the exact starting state
 * (spec §45) and the backend can regenerate/validate the same level (spec §64).
 */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic integer in [0, n). */
export function randInt(rand, n) {
  return Math.floor(rand() * n);
}

/** Deterministic pick from an array. */
export function pick(rand, arr) {
  return arr[randInt(rand, arr.length)];
}
