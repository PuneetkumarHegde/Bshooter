import { Router } from 'express';
import { listAchievements, myAchievements } from '../controllers/achievementController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireDb } from '../middleware/requireDb.js';

const router = Router();

router.get('/', listAchievements); // works without DB (static catalog)
router.get('/me', requireDb, requireAuth, myAchievements);

export default router;
