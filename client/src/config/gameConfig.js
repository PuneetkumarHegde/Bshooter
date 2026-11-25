/**
 * gameConfig.js — SINGLE SOURCE OF TRUTH for the frontend.
 *
 * The game name comes ONLY from the environment (VITE_GAME_NAME).
 * Nothing in the app hardcodes a product name — every screen, the navbar,
 * the landing page, emails, SEO/OG/PWA metadata, and error pages read GAME_NAME
 * from here. Change VITE_GAME_NAME, rebuild, and the whole app renames itself.
 */

export const GAME_NAME = import.meta.env.VITE_GAME_NAME || 'BUBBLE BLAST ADVENTURE';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// A short "title-cased" variant for headings where ALL CAPS is too shouty.
export const GAME_NAME_TITLE = GAME_NAME.split(' ')
  .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
  .join(' ');

/** Core board / physics tuning — kept in one place so levels stay data-driven. */
export const BOARD = {
  cols: 11, // bubbles per full row (offset rows have cols-1)
  rows: 14, // max visible grid rows
  bubbleRadius: 18, // logical radius; the renderer scales to the canvas
  shooterReloadMs: 120,
  shotSpeed: 14, // px per tick in logical space
  snapDistance: 0.72, // fraction of a bubble diameter used for collision snap
  dangerRow: 12, // if bubbles cross this row, the player loses
};

/** Original bubble color identity (NOT copied from any reference game). */
export const COLORS = {
  red: '#ff5d73',
  blue: '#4aa8ff',
  green: '#3ddc84',
  yellow: '#ffd23f',
  purple: '#b06bff',
  orange: '#ff9f45',
  pink: '#ff7ac6',
  cyan: '#45e0d8',
};

export const COLOR_ORDER = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];

/** Scoring table (see spec §35). */
export const SCORING = {
  bubblePop: 10,
  match3: 30,
  match4: 50,
  match5: 80,
  match6plus: 120,
  floatingBubble: 20,
  rescue: 100,
  perfectShotBonus: 25,
  comboStep: 15, // added per combo level
};

export const STARS = {
  // Fallback star thresholds as a fraction of target score when a level
  // does not define its own thresholds.
  twoStar: 0.66,
  threeStar: 0.9,
};

export default { GAME_NAME, GAME_NAME_TITLE, API_URL, BOARD, COLORS, COLOR_ORDER, SCORING, STARS };
