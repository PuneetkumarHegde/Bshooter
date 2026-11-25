import { Link } from 'react-router-dom';
import { GAME_NAME } from '../config/gameConfig.js';
import useProgressStore from '../store/useProgressStore.js';
import { CAMPAIGN_LEVEL_COUNT, levelMeta } from '../data/levelGenerator.js';
import Stars from '../components/Stars.jsx';

const DIFF_COLOR = {
  tutorial: 'text-sky-300',
  beginner: 'text-emerald-300',
  easy: 'text-lime-300',
  medium: 'text-amber-300',
  hard: 'text-orange-300',
  expert: 'text-rose-300',
};

// Show the campaign plus a few "endless" auto-generated levels.
const TOTAL_SHOWN = CAMPAIGN_LEVEL_COUNT + 10;

export default function LevelSelect() {
  const { unlockedLevel, completedLevels, isUnlocked } = useProgressStore();

  const levels = Array.from({ length: TOTAL_SHOWN }, (_, i) => levelMeta(i + 1));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="font-display text-4xl font-extrabold">{GAME_NAME} — Levels</h1>
        <p className="text-white/60">
          {CAMPAIGN_LEVEL_COUNT} campaign levels + endless auto-generated stages. Next up: Level {unlockedLevel}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {levels.map((lvl) => {
          const n = lvl.levelNumber;
          const unlocked = isUnlocked(n);
          const stars = completedLevels[n]?.stars || 0;
          const endless = n > CAMPAIGN_LEVEL_COUNT;

          const inner = (
            <div
              className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl border p-2 transition ${
                unlocked
                  ? 'border-white/10 bg-night-800/70 hover:border-brand-400 hover:bg-brand-500/15 hover:shadow-glow'
                  : 'border-white/5 bg-night-900/50 opacity-60'
              }`}
            >
              {!unlocked && <span className="absolute right-2 top-2 text-sm">🔒</span>}
              {endless && unlocked && <span className="absolute left-2 top-2 text-[10px]">♾️</span>}
              <span className="font-display text-2xl font-extrabold">{n}</span>
              <span className={`text-[10px] font-semibold uppercase ${DIFF_COLOR[lvl.difficulty] || 'text-white/50'}`}>
                {lvl.difficulty}
              </span>
              <Stars value={stars} size="sm" className="mt-1" />
            </div>
          );

          return unlocked ? (
            <Link key={n} to={`/game/${n}`}>
              {inner}
            </Link>
          ) : (
            <div key={n} title="Complete the previous level to unlock" className="cursor-not-allowed">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
