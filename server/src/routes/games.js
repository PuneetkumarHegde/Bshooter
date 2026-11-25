import { Router } from 'express';
import { startGame, completeGame, history, getSession } from '../controllers/gameController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireDb } from '../middleware/requireDb.js';

const router = Router();

router.use(requireDb, requireAuth);
router.post('/start', startGame);
router.post('/complete', completeGame);
router.get('/history', history);
router.get('/:id', getSession);

export default router;
