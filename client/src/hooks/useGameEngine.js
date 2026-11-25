/**
 * useGameEngine.js — React binding for the framework-agnostic GameEngine.
 *
 * Creates the engine, wires it to a <canvas>, forwards pointer/keyboard input,
 * and exposes a live snapshot + imperative controls. All game logic stays in the
 * engine; this hook is only glue (spec §84 game-logic separation).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import GameEngine from '../game/gameEngine.js';
import audio from '../services/audioEngine.js';

export function useGameEngine(level) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [snapshot, setSnapshot] = useState(null);

  // Create / (re)initialize the engine when the level changes.
  useEffect(() => {
    if (!level) return undefined;
    const engine = new GameEngine({
      onChange: setSnapshot,
      onSound: (name) => audio.play(name),
    });
    engineRef.current = engine;
    engine.init(level);
    if (canvasRef.current) engine.setCanvas(canvasRef.current);
    engine.start();
    setSnapshot(engine.getSnapshot());

    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      engine.destroy();
      engineRef.current = null;
    };
  }, [level]);

  // Pointer handlers (desktop mouse + mobile touch, spec §12, §51, §52).
  const onPointerMove = useCallback((e) => {
    const p = 'touches' in e ? e.touches[0] : e;
    if (p) engineRef.current?.setAim(p.clientX, p.clientY);
  }, []);

  const onPointerDown = useCallback((e) => {
    audio.ensure();
    const p = 'touches' in e ? e.touches[0] : e;
    if (p) engineRef.current?.setAim(p.clientX, p.clientY);
  }, []);

  const onPointerUp = useCallback(() => {
    engineRef.current?.shoot();
  }, []);

  // Keyboard shortcuts (spec §52): space = shoot, R = restart, Esc = pause.
  useEffect(() => {
    const onKey = (e) => {
      const eng = engineRef.current;
      if (!eng) return;
      if (e.code === 'Space') {
        e.preventDefault();
        eng.shoot();
      } else if (e.key === 'r' || e.key === 'R') {
        eng.restart();
      } else if (e.key === 'Escape') {
        if (eng.state === 'PAUSED') eng.resume();
        else eng.pause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const controls = {
    shoot: () => engineRef.current?.shoot(),
    pause: () => engineRef.current?.pause(),
    resume: () => engineRef.current?.resume(),
    restart: () => engineRef.current?.restart(),
    useBooster: (t) => engineRef.current?.useBooster(t),
    undo: () => engineRef.current?.undo(),
    hint: () => engineRef.current?.requestHint(),
  };

  return { canvasRef, snapshot, controls, onPointerMove, onPointerDown, onPointerUp };
}

export default useGameEngine;
