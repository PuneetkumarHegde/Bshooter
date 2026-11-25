/**
 * objectiveManager.js — Level objectives + level-type rules (spec §26, §28).
 *
 * Objective types:
 *   clear_all      — pop every bubble on the board
 *   rescue         — reveal N hidden objects
 *   target_score   — reach a score threshold
 *   clear_colors   — clear all bubbles of specific color(s)
 *   limited_shots  — complete within the shot budget (paired with another goal)
 *   drop_bubbles   — drop N bubbles (via floating detection)
 *   combo_challenge— reach a required combo
 */

export function describeObjective(objective, level) {
  switch (objective.type) {
    case 'clear_all':
      return 'Clear all the bubbles';
    case 'rescue':
      return `Rescue ${objective.count || level?.hiddenTargets?.length || 1} hidden friend(s)`;
    case 'target_score':
      return `Reach ${objective.target?.toLocaleString?.() || objective.target} points`;
    case 'clear_colors':
      return `Clear all ${(objective.colors || []).join(', ')} bubbles`;
    case 'limited_shots':
      return `Finish within ${level?.shots ?? '?'} shots`;
    case 'drop_bubbles':
      return `Drop ${objective.count} bubbles`;
    case 'combo_challenge':
      return `Reach a x${objective.combo} combo`;
    default:
      return 'Complete the level';
  }
}

/**
 * Evaluate whether the objective is complete given the current game snapshot.
 * @returns {boolean}
 */
export function isObjectiveComplete(objective, state) {
  const { board, score, rescuedCount, droppedCount, bestCombo } = state;
  const remaining = board.size;

  switch (objective.type) {
    case 'clear_all':
      return remaining === 0;
    case 'rescue':
      return rescuedCount >= (objective.count || 1);
    case 'target_score':
      return score >= objective.target;
    case 'clear_colors': {
      const targetColors = new Set(objective.colors || []);
      for (const b of board.values()) {
        if (targetColors.has(b.color)) return false;
      }
      return true;
    }
    case 'limited_shots':
      // Paired goal lives in objective.goal; default to clear_all.
      return isObjectiveComplete(objective.goal || { type: 'clear_all' }, state);
    case 'drop_bubbles':
      return droppedCount >= objective.count;
    case 'combo_challenge':
      return bestCombo >= objective.combo;
    default:
      return remaining === 0;
  }
}
