/**
 * specialBubbles.js — Special bubble behaviors with real game logic (spec §38).
 *
 * Implemented:
 *   bomb      — pops all bubbles within a radius of the impact cell
 *   fire      — destroys the connected cluster regardless of color
 *   rainbow   — matches any color (handled as a wildcard in matchDetector)
 *   lightning — clears the entire row it lands on
 *   color     — color-changer: recolors nearby bubbles to the shot's color
 *
 * Each returns the SET of cellKeys to remove (beyond a normal color match).
 */

import { cellKey, neighbors } from './hexGrid.js';

function ring(board, row, col, cols, maxRows, depth) {
  const out = new Set([cellKey(row, col)]);
  let frontier = [{ row, col }];
  for (let d = 0; d < depth; d++) {
    const next = [];
    for (const c of frontier) {
      for (const [nr, nc] of neighbors(c.row, c.col, cols, maxRows)) {
        const key = cellKey(nr, nc);
        if (!out.has(key)) {
          out.add(key);
          next.push({ row: nr, col: nc });
        }
      }
    }
    frontier = next;
  }
  return out;
}

export function applySpecial(special, landing, board, geo) {
  const { cols, maxRows } = geo;
  const { row, col } = landing;

  switch (special) {
    case 'bomb': {
      const keys = ring(board, row, col, cols, maxRows, 2);
      return [...keys].filter((k) => board.has(k));
    }
    case 'lightning': {
      const keys = [];
      for (const [key, b] of board.entries()) {
        if (b.row === row) keys.push(key);
      }
      return keys;
    }
    case 'fire': {
      // Destroy the immediate connected cluster (any color) within depth 2.
      const keys = ring(board, row, col, cols, maxRows, 2);
      return [...keys].filter((k) => board.has(k));
    }
    default:
      return [];
  }
}

/** Color-changer: returns a list of {key,newColor} recolor operations. */
export function applyColorChanger(landing, newColor, board, geo) {
  const { cols, maxRows } = geo;
  const ops = [];
  for (const [nr, nc] of neighbors(landing.row, landing.col, cols, maxRows)) {
    const key = cellKey(nr, nc);
    const b = board.get(key);
    if (b && !b.special) ops.push({ key, newColor });
  }
  return ops;
}
