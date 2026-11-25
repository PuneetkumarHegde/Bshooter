/**
 * floatingDetector.js — Floating / disconnected bubble detection (spec §20).
 *
 * After a pop, any bubble no longer connected (directly or transitively) to the
 * ceiling (row 0) must fall. We flood-fill from every bubble anchored to row 0;
 * everything not reached is "floating" and should drop with animation.
 */

import { cellKey, neighbors } from './hexGrid.js';

/**
 * @param {Map<string,Bubble>} board
 * @param {number} cols
 * @param {number} maxRows
 * @returns {Bubble[]} bubbles that are no longer attached to the ceiling
 */
export function findFloatingBubbles(board, cols, maxRows) {
  const anchored = new Set();
  const queue = [];

  // Seed BFS from every bubble sitting in the top row (the ceiling).
  for (const [key, bubble] of board.entries()) {
    if (bubble.row === 0) {
      anchored.add(key);
      queue.push(bubble);
    }
  }

  while (queue.length) {
    const { row, col } = queue.shift();
    for (const [nr, nc] of neighbors(row, col, cols, maxRows)) {
      const key = cellKey(nr, nc);
      if (anchored.has(key)) continue;
      if (board.has(key)) {
        anchored.add(key);
        queue.push(board.get(key));
      }
    }
  }

  const floating = [];
  for (const [key, bubble] of board.entries()) {
    if (!anchored.has(key)) floating.push(bubble);
  }
  return floating;
}
