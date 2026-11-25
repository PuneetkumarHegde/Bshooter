/**
 * gameConfig.js — SINGLE SOURCE OF TRUTH for the backend.
 *
 * The game name comes ONLY from the environment (GAME_NAME). No backend file
 * hardcodes the product name — admin config, emails, and API metadata read it
 * from here (spec §7). Change GAME_NAME in the environment and the whole backend
 * renames itself.
 */
import dotenv from 'dotenv';
dotenv.config();

export const GAME_NAME = process.env.GAME_NAME || 'BUBBLE BLAST ADVENTURE';

export const config = {
  gameName: GAME_NAME,
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev_insecure_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
};

export default config;
