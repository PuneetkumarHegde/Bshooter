/** PauseModal.jsx — Pause overlay; gameplay is genuinely halted (spec §44). */
import { useNavigate } from 'react-router-dom';
import useSettingsStore from '../store/useSettingsStore.js';

export default function PauseModal({ onResume, onRestart }) {
  const navigate = useNavigate();
  const { sound, music, toggleSound, toggleMusic } = useSettingsStore();

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-xs animate-pop-in text-center">
        <h2 className="font-display text-3xl font-extrabold">PAUSED</h2>
        <div className="mt-4 flex flex-col gap-2">
          <button className="btn-primary" onClick={onResume}>
            ▶ Resume
          </button>
          <button className="btn-ghost" onClick={onRestart}>
            ⟳ Restart
          </button>
          <div className="my-1 flex gap-2">
            <button className="btn-ghost flex-1" onClick={toggleSound}>
              {sound ? '🔊 Sound' : '🔇 Sound'}
            </button>
            <button className="btn-ghost flex-1" onClick={toggleMusic}>
              {music ? '🎵 Music' : '🚫 Music'}
            </button>
          </div>
          <button className="btn-ghost" onClick={() => navigate('/levels')}>
            ✕ Exit to Levels
          </button>
        </div>
      </div>
    </div>
  );
}
