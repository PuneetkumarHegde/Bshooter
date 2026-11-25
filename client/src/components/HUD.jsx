/** HUD.jsx — In-game heads-up display (spec §23, §79, §80). */
import { describeObjective } from '../game/objectiveManager.js';

function Stat({ icon, label, value, accent }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white/5 px-3 py-1.5 min-w-[64px]">
      <span className="text-[10px] uppercase tracking-wide text-white/50">{label}</span>
      <span className={`font-display text-lg font-extrabold ${accent || 'text-white'}`}>
        {icon} {value}
      </span>
    </div>
  );
}

export default function HUD({ snapshot, level, controls }) {
  if (!snapshot) return null;
  const objText = level ? describeObjective(level.objective, level) : '';
  const rescueGoal = snapshot.rescuedTotal;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="chip">Level {snapshot.levelNumber}</div>
        <div className="flex flex-1 items-center justify-center">
          <p className="truncate rounded-full bg-brand-500/20 px-3 py-1 text-xs font-semibold text-brand-100">
            🎯 {objText}
            {level?.objective?.type === 'rescue' && rescueGoal ? ` — ${snapshot.rescuedCount}/${rescueGoal}` : ''}
          </p>
        </div>
        <div className="flex gap-1">
          <button className="btn-ghost p-2 text-sm" onClick={controls.hint} title="Hint" aria-label="Hint">
            💡
          </button>
          <button
            className={`btn-ghost p-2 text-sm ${snapshot.canUndo ? '' : 'opacity-40'}`}
            onClick={controls.undo}
            title="Undo"
            aria-label="Undo"
          >
            ↩️
          </button>
          <button className="btn-ghost p-2 text-sm" onClick={controls.pause} title="Pause" aria-label="Pause">
            ⏸️
          </button>
        </div>
      </div>

      <div className="flex items-stretch justify-between gap-2">
        <Stat label="Score" value={snapshot.score.toLocaleString()} accent="text-yellow-300" />
        <Stat label="Shots" icon="🎯" value={snapshot.shotsRemaining} accent={snapshot.shotsRemaining <= 3 ? 'text-rose-400' : 'text-white'} />
        <Stat label="Combo" icon="🔥" value={`x${Math.max(1, snapshot.combo)}`} accent={snapshot.combo >= 2 ? 'text-orange-300' : 'text-white'} />
        <Stat label="Bubbles" value={snapshot.bubblesLeft} />
      </div>
    </div>
  );
}
