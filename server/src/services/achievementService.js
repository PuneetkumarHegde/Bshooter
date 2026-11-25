/**
 * achievementService.js — Evaluates and grants achievements (spec §73).
 * Runs after a validated completion; unlocks are idempotent (unique index).
 */
import Achievement from '../models/Achievement.js';
import UserAchievement from '../models/UserAchievement.js';
import { ACHIEVEMENTS } from '../data/achievements.js';

function metricValue(user, metric, extra) {
  switch (metric) {
    case 'bubblesPopped':
      return user.bubblesPopped;
    case 'levelsCompleted':
      return user.completedLevels.length;
    case 'bestCombo':
      return user.bestCombo;
    case 'rescuedObjects':
      return user.rescuedObjects;
    case 'totalStars':
      return user.totalStars;
    case 'boostersUsed':
      return user.boostersUsed;
    case 'totalScore':
      return user.totalScore;
    case 'perfectLevels':
      return extra.perfect ? 1 : 0;
    default:
      return 0;
  }
}

export async function evaluateAchievements(user, extra = {}) {
  // Catalog from DB if seeded, else fall back to the static list.
  let catalog = await Achievement.find().lean();
  if (!catalog.length) catalog = ACHIEVEMENTS;

  const already = new Set((await UserAchievement.find({ userId: user._id }).lean()).map((u) => u.key));
  const newlyUnlocked = [];

  for (const a of catalog) {
    if (already.has(a.key)) continue;
    if (metricValue(user, a.metric, extra) >= a.threshold) {
      try {
        await UserAchievement.create({ userId: user._id, key: a.key });
        newlyUnlocked.push({ key: a.key, name: a.name, icon: a.icon, desc: a.desc });
      } catch {
        /* unique race — ignore */
      }
    }
  }
  return newlyUnlocked;
}

export default evaluateAchievements;
