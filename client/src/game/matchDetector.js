/**
 * matchDetector.js — Connected-component (chain) matching (spec §18, §19).
 *
 * `findConnectedSameColor` returns ALL bubbles connected to a start bubble that
 * share its color, using BFS over the hex-grid neighbor graph. A Rainbow bubble
 * matches any color, so it is treated as a wildcard during traversal.
 *
 * This is true graph traversal — not "the three cells visually next to it".
 */

import { cellKey, neighbors } from './hexGrid.js';

function colorMatches(a, b) {
  if (!a || !b) return false;
  if (a.special === 'rainbow' || b.special === 'rainbow') return true;
  return a.color === b.color;
}

/**
 * @param {Map<string,Bubble>} board  cellKey -> bubble
 * @param {{row:number,col:number}} start
 * @param {number} cols
 * @param {number} maxRows
 * @returns {Bubble[]} connected same-color group including the start bubble
 */
export function findConnectedSameColor(board, start, cols, maxRows) {
  const startBubble = board.get(cellKey(start.row, start.col));
  if (!startBubble) return [];

  const visited = new Set([cellKey(start.row, start.col)]);
  const group = [startBubble];
  const queue = [start];

  while (queue.length) {
    const { row, col } = queue.shift();
    const current = board.get(cellKey(row, col));
    for (const [nr, nc] of neighbors(row, col, cols, maxRows)) {
      const key = cellKey(nr, nc);
      if (visited.has(key)) continue;
      const nb = board.get(key);
      if (nb && colorMatches(current, nb)) {
        visited.add(key);
        group.push(nb);
        queue.push({ row: nr, col: nc });
      }
    }
  }
  return group;
}

/** Convenience: does attaching at `start` create a pop (group >= minMatch)? */
export function wouldPop(board, start, cols, maxRows, minMatch = 3) {
  return findConnectedSameColor(board, start, cols, maxRows).length >= minMatch;
}
