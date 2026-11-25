/** LevelComplete.jsx — Victory screen (spec §42). */
import Stars from './Stars.jsx';
import Character from './Character.jsx';

export default function LevelComplete({ snapshot, result, onNext, onReplay, onLevelSelect, saving, hasNext }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-sm animate-pop-in text-center">
        <Character size={96} mood="cheer" className="mx-auto" />
        <h2 className="font-display text-3xl font-extrabold text-yellow-300">LEVEL COMPLETE!</h2>
        <Stars value={result?.stars ?? snapshot.stars} size="lg" className="my-3 justify-center" />

        <div className="my-4 grid grid-cols-2 gap-2 text-left text-sm">
          <Row label="Score" value={(result?.score ?? snapshot.score).toLocaleString()} />
          <Row label="Shots used" value={snapshot.shotsUsed} />
          <Row label="Shots left" value={snapshot.shotsRemaining} />
          <Row label="Bubbles popped" value={snapshot.bubblesPopped} />
          <Row label="Best combo" value={`x${snapshot.bestCombo}`} />
          {snapshot.rescuedTotal > 0 && <Row label="Rescued" value={`${snapshot.rescuedCount}/${snapshot.rescuedTotal}`} />}
        </div>

        {result?.serverValidated === false && (
          <p className="mb-2 text-xs text-amber-300">Saved locally — will sync when you're back online.</p>
        )}
        {saving && <p className="mb-2 text-xs text-white/50">Saving score…</p>}

        <div className="flex flex-col gap-2">
          {hasNext && (
            <button className="btn-primary" onClick={onNext} disabled={saving}>
              Next Level →
            </button>
          )}
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={onReplay}>
              Replay
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
