/** levelController.js — Public level listing + fetch (spec §91 Levels). */
import { asyncHandler } from '../utils/asyncHandler.js';
import { getLevel } from '../services/levelService.js';
import { CAMPAIGN_LEVEL_COUNT, generateLevel } from '../data/levelGenerator.js';
import Level from '../models/Level.js';
import { isDbReady } from '../config/db.js';

export const listLevels = asyncHandler(async (req, res) => {
  // Return lightweight metadata for the campaign (+ a few endless stages).
  const count = CAMPAIGN_LEVEL_COUNT + 10;
  let overrides = {};
  if (isDbReady()) {
    const docs = await Level.find({ isPublished: true }).lean();
    overrides = Object.fromEntries(docs.map((d) => [d.levelNumber, d]));
  }
  const levels = [];
  for (let n = 1; n <= count; n++) {
    const base = overrides[n] || generateLevel(n);
    levels.push({
      levelNumber: base.levelNumber,
      difficulty: base.difficulty,
      objective: base.objective,
      shots: base.shots,
      targetScore: base.targetScore,
      colors: base.colors,
    });
  }
  res.json({ levels, campaignCount: CAMPAIGN_LEVEL_COUNT });
});

export const getOneLevel = asyncHandler(async (req, res) => {
  const n = parseInt(req.params.id, 10);
  if (!Number.isInteger(n) || n < 1) return res.status(400).json({ message: 'Invalid level id' });
  const level = await getLevel(n);
  res.json(level);
});
