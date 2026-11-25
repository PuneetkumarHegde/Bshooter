import { Router } from 'express';
import { listLevels, createLevel, updateLevel, deleteLevel, setPublished } from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { requireDb } from '../middleware/requireDb.js';

const router = Router();

router.use(requireDb, requireAuth, requireAdmin);
router.get('/levels', listLevels);
router.post('/levels', createLevel);
router.put('/levels/:id', updateLevel);
router.delete('/levels/:id', deleteLevel);
router.patch('/levels/:id/publish', setPublished);

export default router;
