import { useEffect, useState } from 'react';
import { GAME_NAME } from '../config/gameConfig.js';
import { fetchLeaderboard, fetchMyRank } from '../services/leaderboardService.js';
import useAuthStore from '../store/useAuthStore.js';
import Loading from '../components/Loading.jsx';

const SCOPES = [
  { id: 'global', label: 'Global' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'friends', label: 'Friends' },
];

const MEDAL = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const user = useAuthStore((s) => s.user);
  const [scope, setScope] = useState('global');
  const [rows, setRows] = useState(null);
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setRows(null);
    setError('');
    fetchLeaderboard(scope)
      .then((d) => setRows(d?.leaderboard || []))
      .catch(() => {
        setRows([]);
        setError('Leaderboard is unavailable right now.');
      });
    if (user) fetchMyRank().then(setMe).catch(() => setMe(null));
  }, [scope, user]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-center font-display text-4xl font-extrabold">🏆 Leaderboard</h1>
      <p className="mb-6 text-center text-white/60">Top players in {GAME_NAME}</p>

      <div className="mb-4 flex justify-center gap-2">
        {SCOPES.map((s) => (
          <button
            key={s.id}
            onClick={() => setScope(s.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              scope === s.id ? 'bg-brand-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {rows === null ? (
        <Loading label="Loading rankings…" />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="grid grid-cols-[48px_1fr_auto_auto] gap-2 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-wide text-white/50">
            <span>Rank</span>
            <span>Player</span>
            <span className="text-right">Score</span>
            <span className="text-right">Stars</span>
          </div>
          {rows.length === 0 ? (
            <p className="px-4 py-8 text-center text-white/50">{error || 'No scores yet — be the first!'}</p>
          ) : (
            rows.map((r, i) => (
              <div
                key={r._id || r.userId || i}
                className={`grid grid-cols-[48px_1fr_auto_auto] items-center gap-2 px-4 py-3 text-sm ${
                  r.isMe ? 'bg-brand-500/15' : i % 2 ? 'bg-white/[0.02]' : ''
                }`}
              >
                <span className="font-bold">{MEDAL[i] || i + 1}</span>
                <span className="truncate">{r.name}{r.isMe ? ' (you)' : ''}</span>
                <span className="text-right font-semibold text-yellow-300">{(r.score || 0).toLocaleString()}</span>
                <span className="text-right">⭐ {r.totalStars ?? r.stars ?? 0}</span>
              </div>
            ))
          )}
        </div>
      )}

      {me && (
        <div className="mt-4 card flex items-center justify-between">
          <span className="font-semibold">Your rank</span>
          <span className="font-display text-xl font-extrabold text-brand-300">#{me.rank ?? '—'}</span>
          <span className="text-yellow-300">{(me.score || 0).toLocaleString()} pts</span>
        </div>
      )}
    </div>
  );
}
