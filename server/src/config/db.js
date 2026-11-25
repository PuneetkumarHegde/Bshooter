/**
 * db.js — MongoDB connection (spec §66).
 *
 * If MONGODB_URI is not provided the API still boots so health checks and the
 * (offline-capable) frontend keep working; DB-backed routes then respond 503 via
 * the `requireDb` guard. This avoids a hard crash during evaluation setup.
 */
import mongoose from 'mongoose';
import { config } from './gameConfig.js';

let ready = false;

export function isDbReady() {
  return ready && mongoose.connection.readyState === 1;
}

export async function connectDb() {
  if (!config.mongoUri) {
    console.warn('[db] MONGODB_URI is empty — starting WITHOUT a database. DB routes will return 503.');
    return false;
  }
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 });
    ready = true;
    console.log('[db] Connected to MongoDB');
    return true;
  } catch (err) {
    console.error('[db] Connection failed:', err.message);
    return false;
  }
}

export default connectDb;
