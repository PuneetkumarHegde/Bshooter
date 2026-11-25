import { Router } from 'express';
import { getDaily, completeDaily } from '../controllers/dailyController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireDb } from '../middleware/requireDb.js';

const router = Router();

router.get('/', getDaily); // generated; works without DB
router.post('/complete', requireDb, requireAuth, completeDaily);

export default router;
