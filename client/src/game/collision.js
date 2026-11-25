/**
 * collision.js — Trajectory simulation, wall bouncing, and snap-to-grid
 * (spec §13 trajectory, §14 wall bounce, §15 collision).
 *
 * `simulateShot` is shared by BOTH the aim preview and the real shot so the
 * predicted path and the actual landing cell always agree. It marches a point
 * along the aim vector, reflects off side walls, and stops at the ceiling or the
 * first existing bubble it overlaps, then resolves the nearest empty grid cell.
 */

import { cellKey, cellToPixel, pixelToCell, neighbors, isValidCell } from './hexGrid.js';

function dist2(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

/**
 * Find the empty grid cell where a bubble should snap, given the stop position.
 * Prefers the cell the point is in; if occupied/invalid, picks the closest
 * empty neighbor of the nearest occupied cell.
 */
export function resolveLandingCell(x, y, board, geo) {
  const { r, cols, maxRows } = geo;
  const base = pixelToCell(x, y, r, cols);

  const isFree = (row, col) =>
    isValidCell(row, col, cols, maxRows) && !board.has(cellKey(row, col));

  if (isFree(base.row, base.col)) return base;

  // Gather candidate empty cells around the point and pick the closest.
  const candidates = [];
  const scan = [base, ...neighbors(base.row, base.col, cols, maxRows).map(([row, col]) => ({ row, col }))];
  for (const c of scan) {
    for (const [nr, nc] of neighbors(c.row, c.col, cols, maxRows)) {
      if (isFree(nr, nc)) candidates.push({ row: nr, col: nc });
    }
    if (isFree(c.row, c.col)) candidates.push(c);
  }

  let best = null;
  let bestD = Infinity;
  for (const c of candidates) {
    const p = cellToPixel(c.row, c.col, r);
    const d = dist2(x, y, p.x, p.y);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best || base;
}

/**
 * Simulate a shot from `origin` at `angle` (radians; 0 = right, PI/2 = straight up).
 * @returns {{ path:{x,y}[], landing:{row,col}|null, bounces:number }}
 */
export function simulateShot(origin, angle, board, geo, opts = {}) {
  const { r, cols, maxRows, width } = geo;
  const step = opts.step ?? r * 0.5;
  const maxIterations = opts.maxIterations ?? 2000;

  let x = origin.x;
  let y = origin.y;
  const vx = Math.cos(angle) * step;
  const vy = -Math.sin(angle) * step; // up is negative y
  let dirX = vx;

  const path = [{ x, y }];
  let bounces = 0;
  const hitRadius2 = (r * 2 * (geo.snapFactor ?? 0.9)) ** 2;

  for (let i = 0; i < maxIterations; i++) {
    x += dirX;
    y += vy;

    // Side-wall reflection (spec §14).
    if (x < r) {
      x = r;
      dirX = -dirX;
      bounces++;
    } else if (x > width - r) {
      x = width - r;
      dirX = -dirX;
      bounces++;
    }

    path.push({ x, y });

    // Ceiling.
    if (y <= r) {
      return { path, landing: resolveLandingCell(x, y, board, geo), bounces };
    }

    // Existing bubble collision.
    for (const bubble of board.values()) {
      const p = cellToPixel(bubble.row, bubble.col, r);
      if (dist2(x, y, p.x, p.y) <= hitRadius2) {
        return { path, landing: resolveLandingCell(x, y, board, geo), bounces };
      }
    }

    // Safety: fell off the bottom (shouldn't happen when aiming up).
    if (y > geo.height + r * 4) break;
  }

  return { path, landing: resolveLandingCell(x, y, board, geo), bounces };
}
