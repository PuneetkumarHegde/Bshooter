/**
 * levelService.js — Resolves a level config: prefer the DB (admin-edited),
 * fall back to deterministic generation (spec §29, §30).
 */
import Level from '../models/Level.js';
import { isDbReady } from '../config/db.js';
import { generateLevel } from '../data/levelGenerator.js';

export async function getLevel(levelNumber) {
  if (isDbReady()) {
    const doc = await Level.findOne({ levelNumber, isPublished: true }).lean();
    if (doc && doc.boardLayout?.length) return doc;
  }
  return generateLevel(levelNumber);
}

export default getLevel;
