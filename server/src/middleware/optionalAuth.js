/** optionalAuth.js — Attaches req.user if a valid token is present; never blocks. */
import { verifyToken } from '../utils/token.js';
import User from '../models/User.js';

export async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
      const decoded = verifyToken(token);
      req.user = await User.findById(decoded.sub);
    }
  } catch {
    /* ignore — anonymous */
  }
  next();
}
