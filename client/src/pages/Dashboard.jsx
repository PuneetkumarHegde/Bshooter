import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GAME_NAME } from '../config/gameConfig.js';
import useAuthStore from '../store/useAuthStore.js';
import useProgressStore from '../store/useProgressStore.js';
import { fetchHistory } from '../services/gameService.js';
import { fetchDailyChallenge } from '../services/leaderboardService.js';
import Character from '../components/Character.jsx';
import Stars from '../components/Stars.jsx';

function StatCard({ icon, label, value }) {
  return (
    <div className="card flex items-center gap-3">
      <span className="text-3xl">{icon}</span>
      <div>
        <div className="font-display text-2xl font-extrabold">{value}</div>
        <div className="text-xs uppercase tracking-wide text-white/50">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { totalStars, totalScore, levelsCompleted, unlockedLevel, completedLevels } = useProgressStore();
  const [history, setHistory] = useState([]);
  const [daily, setDaily] = useState(null);

  useEffect(() => {
    fetchHistory().then((d) => setHistory(d?.sessions || [])).catch(() => {});
    fetchDailyChallenge().then(setDaily).catch(() => {});
  }, []);

  const bubblesPopped = user?.bubblesPopped ?? 0;
  const bestCombo = user?.bestCombo ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Character size={72} />
          <div>
            <h1 className="font-display text-3xl font-extrabold">Hi, {user?.name} 👋</h1>
            <p className="text-white/60">Welcome back to {GAME_NAME}</p>
          </div>
        </div>
        <Link to={`/game/${unlockedLevel}`} className="btn-primary text-lg">
          ▶ Continue — Level {unlockedLevel}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon="⭐" label="Total Stars" value={totalStars} />
        <StatCard icon="🏆" label="Total Score" value={totalScore.toLocaleString()} />
        <StatCard icon="✅" label="Levels Done" value={levelsCompleted} />
        <StatCard icon="🔥" label="Best Combo" value={`x${bestCombo}`} />
        <StatCard icon="💥" label="Bubbles Popped" value={bubblesPopped.toLocaleString()} />
        <StatCard icon="🎉" label="Rescues" value={user?.rescuedObjects ?? 0} />
        <StatCard icon="🎯" label="Current Level" value={unlockedLevel} />
        <StatCard icon="🧩" label="Achievements" value={user?.achievementsCount ?? 0} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-display text-xl font-bold">🎲 Daily Challenge</h2>
          {daily ? (
            <div>
              <p className="text-white/70">
                {daily.title || `Daily #${daily.day}`} — {daily.objectiveText || 'Special puzzle'}
              </p>
              <p className="mt-1 text-sm text-white/50">Reward: {daily.reward || '+500 coins, +1 booster'}</p>
              <Link to={`/game/daily`} className="btn-ghost mt-3 inline-flex">
                Play challenge
              </Link>
            </div>
          ) : (
            <p className="text-white/50">No challenge available right now.</p>
          )}
        </div>

        <div className="card">
          <h2 className="mb-3 font-display text-xl font-bold">🕑 Recent Games</h2>
          {history.length === 0 ? (
            <p className="text-white/50">No games yet — jump into a level!</p>
          ) : (
            <ul className="space-y-2">
              {history.slice(0, 6).map((h) => (
                <li key={h._id || h.sessionId} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
                  <span>Level {h.levelNumber}</span>
                  <span className="text-white/60">{(h.score || 0).toLocaleString()} pts</span>
                  <Stars value={h.stars || 0} size="sm" />
                  <span className={h.completed ? 'text-emerald-300' : 'text-rose-300'}>
                    {h.completed ? 'Win' : 'Loss'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick level grid */}
      <div className="mt-8 card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Jump back in</h2>
          <Link to="/levels" className="text-sm font-semibold text-brand-300 hover:underline">
            All levels →
          </Link>
        </div>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
          {Array.from({ length: Math.min(unlockedLevel + 2, 40) }, (_, i) => i + 1).map((n) => {
            const stars = completedLevels[n]?.stars || 0;
            return (
              <Link
                key={n}
                to={`/game/${n}`}
                className="flex flex-col items-center rounded-xl bg-white/5 py-2 hover:bg-white/10"
              >
                <span className="font-display font-bold">{n}</span>
                <Stars value={stars} size="sm" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
