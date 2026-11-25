/**
 * levelGenerator.js (server) — Deterministic level generation that MIRRORS the
 * client generator exactly (same seed → same level). The server uses this to
 * know each level's shot budget, target score and star thresholds so it can
 * validate results WITHOUT trusting the client (spec §64).
 */

const COLOR_ORDER = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];
const BOARD_COLS = 11;
const DIFFICULTY_LABEL = ['tutorial', 'beginner', 'easy', 'medium', 'hard', 'expert'];

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const randInt = (rand, n) => Math.floor(rand() * n);
const pick = (rand, arr) => arr[randInt(rand, arr.length)];
const colsInRow = (row) => (row % 2 === 0 ? BOARD_COLS : BOARD_COLS - 1);

function tierFor(n) {
  if (n <= 5) return 0;
  if (n <= 10) return 1;
  if (n <= 20) return 2;
  if (n <= 30) return 3;
  if (n <= 35) return 4;
  return 5;
}
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
function chooseObjective(n, hiddenCount) {
  if (n <= 3) return { type: 'clear_all' };
  if (n === 4 || n === 5) return { type: 'rescue', count: 1 };
  const m = n % 10;
  if (m === 2 || m === 7) return { type: 'rescue', count: hiddenCount };
  if (m === 4) return { type: 'clear_colors', colors: [] };
  if (m === 5 || m === 0) return { type: 'target_score', target: 0 };
  if (n % 5 === 3) return { type: 'limited_shots', goal: { type: 'clear_all' } };
  if (m === 8) return { type: 'drop_bubbles', count: 8 + tierFor(n) * 4 };
  if (m === 9) return { type: 'combo_challenge', combo: 3 + Math.floor(tierFor(n) / 2) };
  return { type: 'clear_all' };
}
function buildBoard(rand, colors, filledRows) {
  const layout = [];
  let lastRowColors = [];
  for (let row = 0; row < filledRows; row++) {
    const count = colsInRow(row);
    const rowColors = [];
    const fillProb = row < 2 ? 1 : 0.82 - row * 0.015;
    let current = pick(rand, colors);
    for (let col = 0; col < count; col++) {
      if (row >= 2 && rand() > fillProb) {
        rowColors.push(null);
        continue;
      }
      const above = lastRowColors[col];
      if (above && rand() < 0.4) current = above;
      else if (rand() < 0.55) {
        /* keep */
      } else current = pick(rand, colors);
      rowColors.push(current);
      layout.push({ row, col, color: current });
    }
    lastRowColors = rowColors;
  }
  return layout;
}
function placeHidden(rand, layout, count) {
  const maxRow = layout.reduce((m, b) => Math.max(m, b.row), 0);
  const candidates = layout.filter((b) => b.row >= Math.floor(maxRow / 2));
  const chosen = new Set();
  let guard = 0;
  while (chosen.size < count && guard++ < 500 && candidates.length) {
    chosen.add(randInt(rand, candidates.length));
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

export function generateLevel(n) {
  const rand = mulberry32((n * 2654435761) >>> 0);
  const tier = tierFor(n);
  const colors = COLOR_ORDER.slice(0, colorCountFor(n));
  const filledRows = filledRowsFor(n);

  const layout = buildBoard(rand, colors, filledRows);
  const bubbleCount = layout.length;

  const hiddenCount = 1 + Math.floor(tier / 2);
  const objective = chooseObjective(n, hiddenCount);
  let hiddenTargets = [];

  if (objective.type === 'rescue') hiddenTargets = placeHidden(rand, layout, objective.count);
  if (objective.type === 'clear_colors') {
    const counts = {};
    layout.forEach((b) => (counts[b.color] = (counts[b.color] || 0) + 1));
    const sorted = Object.keys(counts).sort((a, b) => counts[a] - counts[b]);
    objective.colors = sorted.slice(0, 1);
  }

  const shots = Math.max(12, Math.ceil(bubbleCount / 2.2) + 6 - tier);
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

export const CAMPAIGN_LEVEL_COUNT = 40;
