/**
 * achievements.js — Achievement catalog (spec §73). At least 10 achievements,
 * each with a metric + threshold the evaluator checks against user stats.
 */
export const ACHIEVEMENTS = [
  { key: 'first_pop', name: 'First Pop', desc: 'Pop your first bubble', icon: '🫧', metric: 'bubblesPopped', threshold: 1 },
  { key: 'bubble_beginner', name: 'Bubble Beginner', desc: 'Complete 5 levels', icon: '🌱', metric: 'levelsCompleted', threshold: 5 },
  { key: 'perfect_aim', name: 'Perfect Aim', desc: 'Finish a level with high shot efficiency', icon: '🎯', metric: 'perfectLevels', threshold: 1 },
  { key: 'combo_master', name: 'Combo Master', desc: 'Reach a x10 combo', icon: '🔥', metric: 'bestCombo', threshold: 10 },
  { key: 'bubble_hunter', name: 'Bubble Hunter', desc: 'Pop 1,000 bubbles', icon: '🏹', metric: 'bubblesPopped', threshold: 1000 },
  { key: 'rescue_hero', name: 'Rescue Hero', desc: 'Rescue 25 objects', icon: '🦸', metric: 'rescuedObjects', threshold: 25 },
  { key: 'star_collector', name: 'Star Collector', desc: 'Earn 50 stars', icon: '⭐', metric: 'totalStars', threshold: 50 },
  { key: 'booster_expert', name: 'Booster Expert', desc: 'Use 25 boosters', icon: '🧪', metric: 'boostersUsed', threshold: 25 },
  { key: 'level_master', name: 'Level Master', desc: 'Complete 40 levels', icon: '👑', metric: 'levelsCompleted', threshold: 40 },
  { key: 'bubble_legend', name: 'Bubble Legend', desc: 'Earn 100,000 points', icon: '🏆', metric: 'totalScore', threshold: 100000 },
];

export default ACHIEVEMENTS;
