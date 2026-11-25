/** GameOver.jsx — Level failure screen (spec §43). */
import Character from './Character.jsx';
import { describeObjective } from '../game/objectiveManager.js';

export default function GameOver({ snapshot, level, onRetry, onBooster, onLevelSelect }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-sm animate-pop-in text-center">
        <Character size={88} mood="sad" className="mx-auto" />
        <h2 className="font-display text-3xl font-extrabold text-rose-400">LEVEL FAILED</h2>
        <p className="mt-1 text-white/60">{level ? describeObjective(level.objective, level) : ''} — not completed</p>

        <div className="my-4 grid grid-cols-2 gap-2 text-left text-sm">
          <Row label="Shots remaining" value={snapshot.shotsRemaining} />
          <Row label="Score" value={snapshot.score.toLocaleString()} />
          <Row label="Bubbles popped" value={snapshot.bubblesPopped} />
          <Row label="Best combo" value={`x${snapshot.bestCombo}`} />
        </div>

        <div className="flex flex-col gap-2">
          <button className="btn-primary" onClick={onRetry}>
            Retry
          </button>
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={onBooster}>
              ➕ Use Booster
            </button>
            <button className="btn-ghost flex-1" onClick={onLevelSelect}>
              Levels
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5">
      <span className="text-white/60">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
