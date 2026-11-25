/** achievementController.js — Achievement catalog + a player's unlocked set (spec §73, §91). */
import Achievement from '../models/Achievement.js';
import UserAchievement from '../models/UserAchievement.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isDbReady } from '../config/db.js';

export const listAchievements = asyncHandler(async (req, res) => {
  let achievements = ACHIEVEMENTS;
  if (isDbReady()) {
    const docs = await Achievement.find().lean();
    if (docs.length) achievements = docs;
  }
  res.json({ achievements });
});

export const myAchievements = asyncHandler(async (req, res) => {
  const unlocked = await UserAchievement.find({ userId: req.user._id }).lean();
  res.json({ unlocked });
});
