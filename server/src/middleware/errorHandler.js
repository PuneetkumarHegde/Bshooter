/** errorHandler.js — Central error handling; never leaks stack traces (spec §82). */
import { config } from '../config/gameConfig.js';

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  // Duplicate key (e.g., email already registered).
  if (err.code === 11000) {
    return res.status(409).json({ message: 'That value is already in use.' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Invalid input.', fields: Object.keys(err.errors || {}) });
  }

  if (config.nodeEnv !== 'production') {
    // Log full detail server-side only.
    console.error('[error]', err);
  }

  res.status(status).json({ message: status === 500 ? 'Something went wrong. Please try again.' : err.message });
}
