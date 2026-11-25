import { Router } from 'express';
import authRoutes from './auth.js';
import levelRoutes from './levels.js';
import gameRoutes from './games.js';
import leaderboardRoutes from './leaderboard.js';
import achievementRoutes from './achievements.js';
import dailyRoutes from './daily.js';
import playerRoutes from './player.js';
import adminRoutes from './admin.js';
import { GAME_NAME } from '../config/gameConfig.js';
import { isDbReady } from '../config/db.js';

const router = Router();

// API meta / health. GAME_NAME comes from the environment (one source of truth).
router.get('/', (_req, res) => {
  res.json({
    game: GAME_NAME,
    status: 'ok',
    db: isDbReady() ? 'connected' : 'unavailable',
    endpoints: ['/auth', '/levels', '/games', '/leaderboard', '/achievements', '/daily-challenge', '/player', '/admin'],
  });
});
router.get('/health', (_req, res) => res.json({ status: 'ok', db: isDbReady() }));

router.use('/auth', authRoutes);
router.use('/levels', levelRoutes);
router.use('/games', gameRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/achievements', achievementRoutes);
router.use('/daily-challenge', dailyRoutes);
router.use('/player', playerRoutes);
router.use('/admin', adminRoutes);

export default router;
