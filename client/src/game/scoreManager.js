/**
 * scoreManager.js — Deterministic, non-random scoring + combo system
 * (spec §35 scoring, §36 combos, §37 chain reactions).
 *
 * All scoring is a pure function of what happened on a shot, so the backend can
 * recompute and validate the same numbers (spec §64). Nothing here is random.
 */

import { SCORING } from '../config/gameConfig.js';

/** Base points for popping a matched group of `n` bubbles. */
export function matchScore(n) {
  if (n >= 6) return SCORING.match6plus + (n - 6) * SCORING.bubblePop;
  if (n === 5) return SCORING.match5;
  if (n === 4) return SCORING.match4;
  if (n === 3) return SCORING.match3;
  return n * SCORING.bubblePop;
}

/**
 * Compute the score gained from a single resolved shot.
 * @param {object} res
 * @param {number} res.popped       bubbles popped by the match
 * @param {number} res.floating     floating bubbles that dropped (chain)
 * @param {number} res.rescued      hidden objects revealed/rescued this shot
 * @param {number} res.comboLevel   current consecutive-successful-shot count
 * @param {boolean} res.perfect     perfect/no-waste shot bonus
 * @returns {{ total:number, breakdown:object }}
 */
export function scoreShot({ popped = 0, floating = 0, rescued = 0, comboLevel = 1, perfect = false }) {
  const breakdown = {};
  breakdown.match = matchScore(popped);
  breakdown.floating = floating * SCORING.floatingBubble;
  breakdown.rescue = rescued * SCORING.rescue;
  breakdown.perfect = perfect ? SCORING.perfectShotBonus : 0;

  const subtotal = breakdown.match + breakdown.floating + breakdown.rescue + breakdown.perfect;

  // Combo multiplier grows with consecutive successful shots.
  const multiplier = comboLevel >= 2 ? 1 + (comboLevel - 1) * 0.15 : 1;
  breakdown.comboMultiplier = Number(multiplier.toFixed(2));

  const total = Math.round(subtotal * multiplier);
  breakdown.total = total;
  return { total, breakdown };
}

/** Star rating from final score against the level's thresholds. */
export function computeStars(score, thresholds) {
  if (!thresholds) return score > 0 ? 1 : 0;
  if (score >= thresholds[2]) return 3;
  if (score >= thresholds[1]) return 2;
  if (score >= thresholds[0]) return 1;
  return 0;
}
