/** token.js — JWT sign / verify helpers. */
import jwt from 'jsonwebtoken';
import { config } from '../config/gameConfig.js';

export function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}
