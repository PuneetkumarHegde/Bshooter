import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GAME_NAME } from '../config/gameConfig.js';
import { generateLevel, CAMPAIGN_LEVEL_COUNT } from '../data/levelGenerator.js';
import { fetchLevel, startSession, completeSession } from '../services/gameService.js';
import { fetchDailyChallenge } from '../services/leaderboardService.js';
import useGameEngine from '../hooks/useGameEngine.js';
import useProgressStore from '../store/useProgressStore.js';
import useSettingsStore from '../store/useSettingsStore.js';
import audio from '../services/audioEngine.js';
import { STATE } from '../game/gameEngine.js';

import HUD from '../components/HUD.jsx';
import BoosterBar from '../components/BoosterBar.jsx';
import LevelComplete from '../components/LevelComplete.jsx';
import GameOver from '../components/GameOver.jsx';
import PauseModal from '../components/PauseModal.jsx';
import Toast from '../components/Toast.jsx';
import Loading from '../components/Loading.jsx';

export default function Game() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const music = useSettingsStore((s) => s.music);
  const { recordCompletion } = useProgressStore();

  const [level, setLevel] = useState(null);
  const [loadingLevel, setLoadingLevel] = useState(true);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const sessionRef = useRef(null);
  const submittedRef = useRef(false);

  // Resolve the level: prefer backend, fall back to local generation (offline).
  useEffect(() => {
    let cancelled = false;
    setLoadingLevel(true);
    setResult(null);
    submittedRef.current = false;

    async function load() {
      let resolved = null;
      if (levelId === 'daily') {
        try {
          const daily = await fetchDailyChallenge();
          resolved = daily?.level || generateLevel(Math.floor(Date.now() / 8.64e7) % 50 + 1);
        } catch {
          resolved = generateLevel(((Math.floor(Date.now() / 8.64e7) % 50) + 1));
        }
      } else {
        const n = Math.max(1, parseInt(levelId, 10) || 1);
        try {
          const srv = await fetchLevel(n);
          resolved = srv?.boardLayout ? srv : generateLevel(n);
        } catch {
          resolved = generateLevel(n);
        }
      }
      if (cancelled) return;
      setLevel(resolved);
      setLoadingLevel(false);

      // Start a server-tracked session (best effort).
      try {
        const s = await startSession(resolved.levelNumber);
        sessionRef.current = s?.sessionToken || null;
      } catch {
        sessionRef.current = null;
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [levelId]);

  const { canvasRef, snapshot, controls, onPointerMove, onPointerDown, onPointerUp } = useGameEngine(level);

  // Background music follows the settings and starts on entering the game.
  useEffect(() => {
    audio.ensure();
    if (music) audio.startMusic();
    return () => audio.stopMusic();
  }, [music]);

  // Submit result once when the level ends in a win.
  useEffect(() => {
    if (!snapshot || !level) return;
    if (snapshot.state === STATE.READY || snapshot.state === STATE.AIMING) {
      submittedRef.current = false; // reset after a restart
    }
    if (snapshot.state === STATE.LEVEL_COMPLETE && !submittedRef.current) {
      submittedRef.current = true;
      handleWin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot?.state]);

  const handleWin = useCallback(async () => {
    const localStars = snapshot.stars;
    const localScore = snapshot.score;
    // Optimistic local progress (works offline).
    recordCompletion(level.levelNumber, { stars: localStars, score: localScore });

    setSaving(true);
    try {
      const res = await completeSession({
        sessionToken: sessionRef.current,
        levelNumber: level.levelNumber,
        score: localScore,
        stars: localStars,
        shotsUsed: snapshot.shotsUsed,
        bubblesPopped: snapshot.bubblesPopped,
        bestCombo: snapshot.bestCombo,
        rescued: snapshot.rescuedCount,
        completed: true,
      });
      // Server is authoritative (spec §64).
      setResult({
        score: res?.score ?? localScore,
        stars: res?.stars ?? localStars,
        serverValidated: true,
        newAchievements: res?.newAchievements || [],
      });
      if (res?.newAchievements?.length) setToast(`🏅 ${res.newAchievements[0].name} unlocked!`);
      if (res?.newHighScore) audio.play('highScore');
    } catch {
      setResult({ score: localScore, stars: localStars, serverValidated: false });
    } finally {
      setSaving(false);
    }
  }, [snapshot, level, recordCompletion]);

  if (loadingLevel || !level) {
    return <Loading label={`Loading ${GAME_NAME}…`} full />;
  }

  const nextLevelNumber = level.levelNumber + 1;
  const hasNext = nextLevelNumber <= CAMPAIGN_LEVEL_COUNT + 10;

  return (
    <div className="flex min-h-screen flex-col bg-night-950">
      <div className="relative mx-auto flex w-full max-w-[440px] flex-1 flex-col px-3 py-3">
        {/* HUD */}
        <HUD snapshot={snapshot} level={level} controls={controls} />

        {/* Canvas board */}
        <div className="no-scroll-touch relative mt-3 flex-1">
          <canvas
            ref={canvasRef}
            className="w-full touch-none rounded-2xl"
            onMouseMove={onPointerMove}
            onMouseDown={onPointerDown}
            onMouseUp={onPointerUp}
            onTouchStart={(e) => {
              onPointerDown(e);
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              onPointerMove(e);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onPointerUp(e);
            }}
          />

          {/* Overlays */}
          {snapshot?.state === STATE.PAUSED && (
            <PauseModal onResume={controls.resume} onRestart={controls.restart} />
          )}
          {snapshot?.state === STATE.LEVEL_COMPLETE && (
            <LevelComplete
              snapshot={snapshot}
              result={result}
              saving={saving}
              hasNext={hasNext}
              onNext={() => navigate(`/game/${nextLevelNumber}`)}
              onReplay={controls.restart}
              onLevelSelect={() => navigate('/levels')}
            />
          )}
          {snapshot?.state === STATE.LEVEL_FAILED && (
            <GameOver
              snapshot={snapshot}
              level={level}
              onRetry={controls.restart}
              onBooster={() => {
                const res = controls.useBooster('extraShot');
                if (res?.ok) {
                  useProgressStore.getState().consumeBooster('extraShot');
                  setToast('+5 shots — keep going!');
                } else {
                  setToast(res?.reason || 'No boosters available');
                }
              }}
              onLevelSelect={() => navigate('/levels')}
            />
          )}

          <Toast message={toast} onDone={() => setToast('')} />
        </div>

        {/* Boosters (spec §40) */}
        <div className="mt-3">
          <BoosterBar
            available={level.availableBoosters}
            snapshot={snapshot}
            controls={controls}
            onMessage={setToast}
          />
        </div>

        {/* Tap-to-shoot helper for mobile + explicit button */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <button className="btn-ghost px-4 py-2 text-sm" onClick={controls.pause}>
            ⏸ Pause
          </button>
          <button className="btn-primary flex-1" onClick={controls.shoot}>
            🫧 Shoot
          </button>
          <button className="btn-ghost px-4 py-2 text-sm" onClick={controls.restart}>
            ⟳ Restart
          </button>
        </div>
      </div>
    </div>
  );
}
