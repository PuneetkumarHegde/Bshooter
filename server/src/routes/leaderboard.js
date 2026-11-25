import { Router } from 'express';
import { getLeaderboard, getMyRank } from '../controllers/leaderboardController.js';
import { requireAuth } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { requireDb } from '../middleware/requireDb.js';

const router = Router();

router.get('/', requireDb, optionalAuth, getLeaderboard);
router.get('/me', requireDb, requireAuth, getMyRank);

export default router;
