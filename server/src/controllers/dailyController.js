/** dailyController.js — One deterministic daily puzzle per date (spec §74). */
import DailyChallenge from '../models/DailyChallenge.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateLevel } from '../data/levelGenerator.js';
import { describeObjective } from '../utils/describeObjective.js';
import { isDbReady } from '../config/db.js';

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function buildDaily(dayKey) {
  const dayNumber = Math.floor(new Date(dayKey).getTime() / 864e5);
  const seedLevel = (dayNumber % 46) + 5; // vary across the campaign range
  const level = generateLevel(seedLevel);
  level.levelNumber = 1000000 + (dayNumber % 100000); // distinct id space for dailies
  return {
    day: dayKey,
    title: `Daily Challenge #${dayNumber}`,
    level,
    objectiveText: describeObjective(level.objective, level),
    reward: '+500 coins, +1 booster',
  };
}

export const getDaily = asyncHandler(async (req, res) => {
  const dayKey = todayKey();
  const built = buildDaily(dayKey);

  if (isDbReady()) {
    let doc = await DailyChallenge.findOne({ day: dayKey });
    if (!doc) {
      doc = await DailyChallenge.create({ day: dayKey, title: built.title, level: built.level, reward: built.reward });
    }
    return res.json({
      day: doc.day,
      title: doc.title,
      level: doc.level,
      reward: doc.reward,
      objectiveText: built.objectiveText,
      completions: doc.completions.length,
    });
  }

  res.json(built);
});

export const completeDaily = asyncHandler(async (req, res) => {
  const dayKey = todayKey();
  const score = Number(req.body?.score) || 0;

  const doc = await DailyChallenge.findOne({ day: dayKey });
  if (!doc) return res.status(404).json({ message: 'No daily challenge today' });

  const already = doc.completions.find((c) => String(c.userId) === String(req.user._id));
  if (already) return res.status(409).json({ message: 'Daily challenge already completed today' });

  doc.completions.push({ userId: req.user._id, score });
  await doc.save();

  // Grant the reward (a booster).
  req.user.boosterInventory.bomb += 1;
  await req.user.save();

  res.json({ message: 'Daily challenge complete!', reward: doc.reward });
});
