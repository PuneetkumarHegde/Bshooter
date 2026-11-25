/**
 * useProgressStore.js — Player progress + booster inventory (spec §33, §70).
 *
 * Progress is authoritative on the SERVER when signed in, but mirrored to
 * localStorage so unlocking and stars survive offline play and sync later.
 */
import { create } from 'zustand';
import { fetchProgress } from '../services/gameService.js';

const LS_KEY = 'bshooter.progress';

const DEFAULT_BOOSTERS = { aim: 3, bomb: 2, rainbow: 2, extraShot: 2, shuffle: 1 };

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { completedLevels: {}, boosterInventory: { ...DEFAULT_BOOSTERS } };
}

function saveLocal(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      completedLevels: state.completedLevels,
      boosterInventory: state.boosterInventory,
    }));
  } catch {
    /* ignore */
  }
}

function deriveTotals(completedLevels) {
  let totalStars = 0;
  let totalScore = 0;
  const keys = Object.keys(completedLevels);
  let highest = 0;
  for (const k of keys) {
    const c = completedLevels[k];
    totalStars += c.stars || 0;
    totalScore += c.bestScore || 0;
    highest = Math.max(highest, Number(k));
  }
  return {
    totalStars,
    totalScore,
    levelsCompleted: keys.length,
    unlockedLevel: Math.max(1, highest + 1),
  };
}

const initial = loadLocal();

export const useProgressStore = create((set, get) => ({
  completedLevels: initial.completedLevels || {},
  boosterInventory: initial.boosterInventory || { ...DEFAULT_BOOSTERS },
  ...deriveTotals(initial.completedLevels || {}),
  synced: false,

  isUnlocked(levelNumber) {
    return levelNumber <= get().unlockedLevel;
  },

  starsFor(levelNumber) {
    return get().completedLevels[levelNumber]?.stars || 0;
  },

  /** Merge server progress (called after login). */
  async syncFromServer() {
    try {
      const data = await fetchProgress();
      if (!data) return;
      const merged = { ...get().completedLevels };
      for (const lvl of data.completedLevels || []) {
        const existing = merged[lvl.levelNumber];
        merged[lvl.levelNumber] = {
          stars: Math.max(existing?.stars || 0, lvl.stars || 0),
          bestScore: Math.max(existing?.bestScore || 0, lvl.bestScore || 0),
        };
      }
      const boosterInventory = data.boosterInventory
        ? { ...get().boosterInventory, ...data.boosterInventory }
        : get().boosterInventory;
      const next = { completedLevels: merged, boosterInventory, synced: true, ...deriveTotals(merged) };
      set(next);
      saveLocal(next);
    } catch {
      set({ synced: false });
    }
  },

  /** Optimistically record a completion locally (server call happens in Game). */
  recordCompletion(levelNumber, { stars, score }) {
    const completedLevels = { ...get().completedLevels };
    const prev = completedLevels[levelNumber] || {};
    completedLevels[levelNumber] = {
      stars: Math.max(prev.stars || 0, stars),
      bestScore: Math.max(prev.bestScore || 0, score),
    };
    const next = { completedLevels, ...deriveTotals(completedLevels) };
    set(next);
    saveLocal({ ...get(), ...next });
  },

  consumeBooster(type) {
    const boosterInventory = { ...get().boosterInventory };
    if (!boosterInventory[type] || boosterInventory[type] <= 0) return false;
    boosterInventory[type] -= 1;
    set({ boosterInventory });
    saveLocal({ ...get(), boosterInventory });
    return true;
  },

  grantBooster(type, n = 1) {
    const boosterInventory = { ...get().boosterInventory };
    boosterInventory[type] = (boosterInventory[type] || 0) + n;
    set({ boosterInventory });
    saveLocal({ ...get(), boosterInventory });
  },

  resetLocal() {
    const fresh = { completedLevels: {}, boosterInventory: { ...DEFAULT_BOOSTERS } };
    set({ ...fresh, ...deriveTotals({}), synced: false });
    saveLocal(fresh);
  },
}));

export default useProgressStore;
