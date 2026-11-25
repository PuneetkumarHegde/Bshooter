/** app.js — Express application wiring (spec §90, §91). */
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/gameConfig.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '256kb' }));

  // CORS — allow the configured frontend origin(s).
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || config.clientOrigins.includes(origin) || config.nodeEnv !== 'production') {
          return cb(null, true);
        }
        return cb(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );

  // Global, lenient rate limit.
  app.use(rateLimit({ windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));

  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
