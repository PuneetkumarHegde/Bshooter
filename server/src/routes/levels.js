import { Router } from 'express';
import { listLevels, getOneLevel } from '../controllers/levelController.js';

const router = Router();

// Levels are generated deterministically, so these work even without a DB.
router.get('/', listLevels);
router.get('/:id', getOneLevel);

export default router;
