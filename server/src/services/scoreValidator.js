/**
 * scoreValidator.js — SERVER-SIDE score validation (spec §64).
 *
 * The browser is never trusted. Given the regenerated level and the reported
 * play stats, we compute plausible upper bounds and reject impossible results
 * (e.g. { score: 999999999 }). Stars are (re)computed by the server from the
 * accepted score against the level's own thresholds.
 */

// Mirror of the client scoring ceiling values (kept intentionally generous).
const MAX_POINTS_PER_BUBBLE = 120; // treat every pop as a 6+ match (best case)
const RESCUE_BONUS = 100;
const PERFECT_BONUS_PER_SHOT = 25;

export function computeStars(score, thresholds) {
  if (!thresholds || thresholds.length < 3) return score > 0 ? 1 : 0;
  if (score >= thresholds[2]) return 3;
  if (score >= thresholds[1]) return 2;
  if (score >= thresholds[0]) return 1;
  return 0;
}

/**
 * @param {object} level  regenerated/stored level config
 * @param {object} sub    reported stats { score, shotsUsed, bubblesPopped, bestCombo, rescued, boostersUsed }
 * @returns {{ valid:boolean, reason?:string, acceptedScore:number, stars:number }}
 */
export function validateScore(level, sub) {
  const boardCount = (level.boardLayout || []).length;
  const boosterShots = (sub.boostersUsed || 0) * 5;

  // Bubble count sanity (specials can pop extras — allow 1.5x margin).
  const maxPopped = Math.ceil(boardCount * 1.5) + 10;
  if ((sub.bubblesPopped || 0) > maxPopped) {
    return { valid: false, reason: 'Implausible bubble count', acceptedScore: 0, stars: 0 };
  }

  // Combo multiplier ceiling (cap the combo we trust).
  const trustedCombo = Math.min(sub.bestCombo || 1, 60);
  const comboMult = 1 + Math.max(0, trustedCombo - 1) * 0.15;

  const maxScore =
    Math.ceil(
      ((sub.bubblesPopped || 0) * MAX_POINTS_PER_BUBBLE +
        (sub.rescued || 0) * RESCUE_BONUS +
        (sub.shotsUsed || 0) * PERFECT_BONUS_PER_SHOT) *
        comboMult
    ) + 500; // small slack

  if ((sub.score || 0) > maxScore) {
    return { valid: false, reason: 'Score exceeds the maximum possible for this level', acceptedScore: 0, stars: 0 };
  }

  const acceptedScore = Math.max(0, Math.floor(sub.score || 0));
  const stars = Math.max(1, computeStars(acceptedScore, level.starThresholds));
  return { valid: true, acceptedScore, stars };
}

export default validateScore;
