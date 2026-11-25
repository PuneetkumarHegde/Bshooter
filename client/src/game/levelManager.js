/**
 * levelManager.js — Turns a (data-driven) level config into a live board and
 * provides level lookup with an offline fallback (spec §30, §75 offline).
 */

import { cellKey } from './hexGrid.js';
import { generateLevel } from '../data/levelGenerator.js';

/** Build the initial board Map (cellKey -> bubble) from a level's layout. */
export function buildInitialBoard(level) {
  const board = new Map();
  for (const cell of level.boardLayout) {
    board.set(cellKey(cell.row, cell.col), {
      row: cell.row,
      col: cell.col,
      color: cell.color,
      special: cell.special || null,
      hidden: !!cell.hidden,
      rescueId: cell.rescueId || null,
    });
  }
  return board;
}

/**
 * Resolve a level config. Prefer a server-provided level (passed in), else
 * generate it locally so the game is fully playable offline.
 */
export function resolveLevel(levelNumber, serverLevel) {
  if (serverLevel && serverLevel.boardLayout) return serverLevel;
  return generateLevel(levelNumber);
}

/** Deep-clone a level's starting board for Restart (spec §45). */
export function cloneBoard(board) {
  const copy = new Map();
  for (const [k, v] of board.entries()) copy.set(k, { ...v });
  return copy;
}
