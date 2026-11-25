import { useEffect, useState } from 'react';
import { GAME_NAME } from '../config/gameConfig.js';
import { fetchAchievements, fetchMyAchievements } from '../services/leaderboardService.js';
import useAuthStore from '../store/useAuthStore.js';
import Loading from '../components/Loading.jsx';

// Fallback catalog (also seeded on the backend) so the page works offline.
const FALLBACK = [
  { key: 'first_pop', name: 'First Pop', desc: 'Pop your first bubble', icon: '🫧' },
  { key: 'bubble_beginner', name: 'Bubble Beginner', desc: 'Complete 5 levels', icon: '🌱' },
  { key: 'perfect_aim', name: 'Perfect Aim', desc: 'Finish a level with high shot efficiency', icon: '🎯' },
  { key: 'combo_master', name: 'Combo Master', desc: 'Reach a x10 combo', icon: '🔥' },
  { key: 'bubble_hunter', name: 'Bubble Hunter', desc: 'Pop 1,000 bubbles', icon: '🏹' },
  { key: 'rescue_hero', name: 'Rescue Hero', desc: 'Rescue 25 objects', icon: '🦸' },
  { key: 'star_collector', name: 'Star Collector', desc: 'Earn 50 stars', icon: '⭐' },
  { key: 'booster_expert', name: 'Booster Expert', desc: 'Use 25 boosters', icon: '🧪' },
  { key: 'level_master', name: 'Level Master', desc: 'Complete 40 levels', icon: '👑' },
  { key: 'bubble_legend', name: 'Bubble Legend', desc: 'Earn 100,000 points', icon: '🏆' },
];

export default function Achievements() {
  const user = useAuthStore((s) => s.user);
  const [all, setAll] = useState(null);
  const [unlocked, setUnlocked] = useState(new Set());

  useEffect(() => {
    fetchAchievements()
      .then((d) => setAll(d?.achievements?.length ? d.achievements : FALLBACK))
      .catch(() => setAll(FALLBACK));
    if (user) {
      fetchMyAchievements()
        .then((d) => setUnlocked(new Set((d?.unlocked || []).map((a) => a.key))))
        .catch(() => {});
    }
  }, [user]);

  if (!all) return <Loading label="Loading achievements…" full />;

  const earned = all.filter((a) => unlocked.has(a.key)).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 text-center font-display text-4xl font-extrabold">🏅 Achievements</h1>
      <p className="mb-6 text-center text-white/60">
        {earned}/{all.length} unlocked in {GAME_NAME}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {all.map((a) => {
          const got = unlocked.has(a.key);
          return (
            <div
              key={a.key}
              className={`card flex items-center gap-4 ${got ? 'border-yellow-400/40 bg-yellow-400/5' : 'opacity-70'}`}
            >
              <span className={`text-4xl ${got ? '' : 'grayscale'}`}>{a.icon}</span>
              <div className="flex-1">
                <h3 className="font-display text-lg font-bold">{a.name}</h3>
                <p className="text-sm text-white/60">{a.desc}</p>
              </div>
              <span className={`text-sm font-bold ${got ? 'text-yellow-300' : 'text-white/30'}`}>
                {got ? 'Unlocked' : 'Locked'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
