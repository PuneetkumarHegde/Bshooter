/** describeObjective.js — Human-readable objective text (mirrors client logic). */
export function describeObjective(objective, level) {
  switch (objective?.type) {
    case 'clear_all':
      return 'Clear all the bubbles';
    case 'rescue':
      return `Rescue ${objective.count || level?.hiddenTargets?.length || 1} hidden friend(s)`;
    case 'target_score':
      return `Reach ${objective.target} points`;
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

export default describeObjective;
