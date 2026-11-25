import { GAME_NAME } from '../config/gameConfig.js';
import useSettingsStore from '../store/useSettingsStore.js';
import useProgressStore from '../store/useProgressStore.js';
import audio from '../services/audioEngine.js';

function Toggle({ label, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 px-4 py-3">
      <div>
        <div className="font-semibold">{label}</div>
        {desc && <div className="text-sm text-white/50">{desc}</div>}
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={onChange}
        className={`relative h-7 w-12 rounded-full transition ${value ? 'bg-brand-500' : 'bg-white/15'}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${value ? 'left-6' : 'left-1'}`}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const { sound, music, reducedMotion, toggleSound, toggleMusic, toggleReducedMotion } = useSettingsStore();
  const resetLocal = useProgressStore((s) => s.resetLocal);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 font-display text-4xl font-extrabold">⚙ Settings</h1>
      <p className="mb-6 text-white/60">{GAME_NAME} preferences</p>

      <div className="card space-y-3">
        <h2 className="font-display text-lg font-bold">Audio</h2>
        <Toggle
          label="🔊 Sound effects"
          desc="Pops, combos and UI sounds"
          value={sound}
          onChange={() => {
            audio.ensure();
            toggleSound();
            if (!sound) audio.play('click');
          }}
        />
        <Toggle label="🎵 Background music" desc="The in-game soundtrack" value={music} onChange={toggleMusic} />
      </div>

      <div className="card mt-4 space-y-3">
        <h2 className="font-display text-lg font-bold">Accessibility</h2>
        <Toggle
          label="🌀 Reduce motion"
          desc="Minimize animations across the app"
          value={reducedMotion}
          onChange={toggleReducedMotion}
        />
      </div>

      <div className="card mt-4">
        <h2 className="mb-2 font-display text-lg font-bold">Local data</h2>
        <p className="mb-3 text-sm text-white/50">
          Clears cached progress on this device. Your server progress (if signed in) is unaffected and
          will re-sync.
        </p>
        <button
          className="btn-danger"
          onClick={() => {
            if (confirm('Reset local progress on this device?')) resetLocal();
          }}
        >
          Reset local progress
        </button>
      </div>
    </div>
  );
}
