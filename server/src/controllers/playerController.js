/** playerController.js — Player progress persistence (spec §70, §91). */
import { asyncHandler } from '../utils/asyncHandler.js';

export const getProgress = asyncHandler(async (req, res) => {
  const u = req.user;
  res.json({
    currentLevel: u.currentLevel,
    completedLevels: u.completedLevels.map((c) => ({
      levelNumber: c.levelNumber,
      stars: c.stars,
      bestScore: c.bestScore,
    })),
    totalScore: u.totalScore,
    totalStars: u.totalStars,
    bubblesPopped: u.bubblesPopped,
    bestCombo: u.bestCombo,
    rescuedObjects: u.rescuedObjects,
    boosterInventory: u.boosterInventory,
  });
});
