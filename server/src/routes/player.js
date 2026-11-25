import { Router } from 'express';
import { getProgress } from '../controllers/playerController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireDb } from '../middleware/requireDb.js';

const router = Router();

router.get('/progress', requireDb, requireAuth, getProgress);

export default router;
