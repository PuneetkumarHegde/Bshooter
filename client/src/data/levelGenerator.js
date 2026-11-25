/**
 * levelGenerator.js — DATA-DRIVEN level creation (spec §29, §30, §31).
 *
 * There are NO 40 hand-written React components. Every level is produced from a
 * single deterministic generator keyed by level number. Levels 1..40 form the
 * designed campaign (tutorial → expert); beyond 40 the same generator keeps
 * producing fresh, progressively harder levels ("auto level generation").
 *
 * Determinism (seed = level number) means a level is identical every time, so
 * Restart restores the exact board and the backend can regenerate it to validate
 * results without trusting the client.
 */

import { mulberry32, randInt, pick } from '../utils/rng.js';
import { COLOR_ORDER } from '../config/gameConfig.js';
import { colsInRow } from '../game/hexGrid.js';

const BOARD_COLS = 11;

function tierFor(n) {
  if (n <= 5) return 0; // tutorial
  if (n <= 10) return 1; // beginner
  if (n <= 20) return 2; // easy
  if (n <= 30) return 3; // medium
  if (n <= 35) return 4; // hard
  return 5; // expert / endless
}

const DIFFICULTY_LABEL = ['tutorial', 'beginner', 'easy', 'medium', 'hard', 'expert'];

function colorCountFor(n) {
  if (n <= 5) return 3;
  if (n <= 10) return 4;
  if (n <= 20) return 5;
  if (n <= 40) return 6;
  return Math.min(8, 6 + Math.floor((n - 40) / 20));
}

function filledRowsFor(n) {
  if (n <= 5) return 4;
  if (n <= 10) return 5;
  if (n <= 20) return 6;
  if (n <= 30) return 7;
  if (n <= 35) return 8;
  if (n <= 40) return 9;
  return Math.min(11, 9 + Math.floor((n - 40) / 15));
}

function chooseObjective(n, rand, hiddenCount) {
  if (n <= 3) return { type: 'clear_all' };
  if (n === 4 || n === 5) return { type: 'rescue', count: 1 };

  const m = n % 10;
  if (m === 2 || m === 7) return { type: 'rescue', count: hiddenCount };
  if (m === 4) return { type: 'clear_colors', colors: [] }; // filled after board build
  if (m === 5 || m === 0) return { type: 'target_score', target: 0 }; // filled after sizing
  if (n % 5 === 3) return { type: 'limited_shots', goal: { type: 'clear_all' } };
  if (m === 8) return { type: 'drop_bubbles', count: 8 + tierFor(n) * 4 };
  if (m === 9) return { type: 'combo_challenge', combo: 3 + Math.floor(tierFor(n) / 2) };
  return { type: 'clear_all' };
}

/**
 * Build a clustered color board (not purely random) so matches feel designed.
 */
function buildBoard(rand, colors, filledRows) {
  const layout = [];
  let lastRowColors = [];
  for (let row = 0; row < filledRows; row++) {
    const count = colsInRow(row, BOARD_COLS);
    const rowColors = [];
    // Top two rows are fully packed so the formation anchors to the ceiling.
    const fillProb = row < 2 ? 1 : 0.82 - row * 0.015;
    let current = pick(rand, colors);
    for (let col = 0; col < count; col++) {
      if (row >= 2 && rand() > fillProb) {
        rowColors.push(null);
        continue;
      }
      // Clustering: tend to repeat the left neighbor or copy the one above.
      const above = lastRowColors[col];
      if (above && rand() < 0.4) current = above;
      else if (rand() < 0.55) {
        /* keep current */
      } else current = pick(rand, colors);
      rowColors.push(current);
      layout.push({ row, col, color: current });
    }
    lastRowColors = rowColors;
  }
  return layout;
}

function placeHidden(rand, layout, count) {
  // Hide rescue objects behind bubbles in the lower half of the formation.
  const maxRow = layout.reduce((m, b) => Math.max(m, b.row), 0);
  const candidates = layout.filter((b) => b.row >= Math.floor(maxRow / 2));
  const chosen = new Set();
  let guard = 0;
  while (chosen.size < count && guard++ < 500 && candidates.length) {
    const idx = randInt(rand, candidates.length);
    chosen.add(idx);
  }
  const targets = [];
  [...chosen].forEach((idx, i) => {
    const b = candidates[idx];
    b.hidden = true;
    b.rescueId = i + 1;
    targets.push({ row: b.row, col: b.col, id: i + 1 });
  });
  return targets;
}

function buildQueue(rand, colors, length, n) {
  const queue = [];
  const allowRainbow = n >= 12;
  const allowBomb = n >= 18;
  for (let i = 0; i < length; i++) {
    const roll = rand();
    if (allowRainbow && roll > 0.97) queue.push({ color: pick(rand, colors), special: 'rainbow' });
    else if (allowBomb && roll > 0.985) queue.push({ color: pick(rand, colors), special: 'bomb' });
    else queue.push({ color: pick(rand, colors) });
  }
  return queue;
}

function boostersFor(n) {
  const base = ['aim', 'extraShot'];
  if (n >= 4) base.push('bomb');
  if (n >= 8) base.push('rainbow');
  if (n >= 12) base.push('shuffle');
  return base;
}

/**
 * Generate a full, data-driven level config.
 * @param {number} n level number (>= 1)
 */
export function generateLevel(n) {
  const rand = mulberry32((n * 2654435761) >>> 0);
  const tier = tierFor(n);
  const colors = COLOR_ORDER.slice(0, colorCountFor(n));
  const filledRows = filledRowsFor(n);

  const layout = buildBoard(rand, colors, filledRows);
  const bubbleCount = layout.length;

  // Objective (some fields depend on the built board).
  const hiddenCount = 1 + Math.floor(tier / 2);
  const objective = chooseObjective(n, rand, hiddenCount);
  let hiddenTargets = [];

  if (objective.type === 'rescue') {
    hiddenTargets = placeHidden(rand, layout, objective.count);
  }
  if (objective.type === 'clear_colors') {
    // Target the least-common color so it is a real sub-goal.
    const counts = {};
    layout.forEach((b) => (counts[b.color] = (counts[b.color] || 0) + 1));
    const sorted = Object.keys(counts).sort((a, b) => counts[a] - counts[b]);
    objective.colors = sorted.slice(0, 1);
  }

  // Shot budget scales with board size and difficulty.
  const shots = Math.max(12, Math.ceil(bubbleCount / 2.2) + 6 - tier);

  // Scoring targets (deterministic, not random).
  const targetScore = bubbleCount * 14 + hiddenTargets.length * 100;
  if (objective.type === 'target_score') objective.target = Math.round(targetScore * 0.7);

  const starThresholds = [
    Math.round(targetScore * 0.5),
    Math.round(targetScore * 0.75),
    Math.round(targetScore * 1.0),
  ];

  const bubbleQueue = buildQueue(rand, colors, shots + 6, n);

  return {
    levelNumber: n,
    difficulty: DIFFICULTY_LABEL[tier],
    objective,
    shots,
    colors,
    boardLayout: layout,
    hiddenTargets,
    bubbleQueue,
    targetScore,
    starThresholds,
    availableBoosters: boostersFor(n),
    isPublished: true,
  };
}

/** Lightweight metadata for the level-select grid (no full board). */
export function levelMeta(n) {
  const lvl = generateLevel(n);
  return {
    levelNumber: lvl.levelNumber,
    difficulty: lvl.difficulty,
    objective: lvl.objective,
    shots: lvl.shots,
    targetScore: lvl.targetScore,
    colors: lvl.colors,
  };
}

export const CAMPAIGN_LEVEL_COUNT = 40;
