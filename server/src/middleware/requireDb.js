/** requireDb.js — Returns 503 for DB-backed routes when MongoDB is unavailable. */
import { isDbReady } from '../config/db.js';

export function requireDb(req, res, next) {
  if (!isDbReady()) {
    return res.status(503).json({ message: 'Database unavailable. Set MONGODB_URI and restart the server.' });
  }
  next();
}
