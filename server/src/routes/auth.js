import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, me, logout } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireDb } from '../middleware/requireDb.js';

const router = Router();

// Throttle auth attempts (basic brute-force protection).
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });

router.post('/register', authLimiter, requireDb, register);
router.post('/login', authLimiter, requireDb, login);
router.get('/me', requireDb, requireAuth, me);
router.post('/logout', requireAuth, logout);

export default router;
