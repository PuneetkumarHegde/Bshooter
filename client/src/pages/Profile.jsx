import { Link } from 'react-router-dom';
import { GAME_NAME } from '../config/gameConfig.js';
import useAuthStore from '../store/useAuthStore.js';
import useProgressStore from '../store/useProgressStore.js';
import Character from '../components/Character.jsx';
import Stars from '../components/Stars.jsx';

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const { totalStars, totalScore, levelsCompleted, boosterInventory } = useProgressStore();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="card flex flex-col items-center gap-3 text-center">
        <Character size={96} />
        <h1 className="font-display text-3xl font-extrabold">{user?.name}</h1>
        <p className="text-white/50">{user?.email}</p>
        <p className="text-sm text-white/40">Playing {GAME_NAME} since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'today'}</p>
        <Stars value={Math.min(3, Math.round(totalStars / 20))} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Box label="Total Score" value={totalScore.toLocaleString()} />
        <Box label="Total Stars" value={totalStars} />
        <Box label="Levels Done" value={levelsCompleted} />
        <Box label="Best Combo" value={`x${user?.bestCombo ?? 0}`} />
      </div>

      <div className="mt-6 card">
        <h2 className="mb-3 font-display text-xl font-bold">🧪 Booster Inventory</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(boosterInventory).map(([k, v]) => (
            <div key={k} className="chip">
              {k}: <span className="font-bold">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link to="/settings" className="btn-ghost flex-1">
          ⚙ Settings
        </Link>
        <Link to="/levels" className="btn-primary flex-1">
          ▶ Keep Playing
        </Link>
      </div>
    </div>
  );
}

function Box({ label, value }) {
  return (
    <div className="card text-center">
      <div className="font-display text-2xl font-extrabold">{value}</div>
      <div className="text-xs uppercase tracking-wide text-white/50">{label}</div>
    </div>
  );
}
