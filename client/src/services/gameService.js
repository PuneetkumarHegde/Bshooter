/**
 * gameService.js — Game session + levels + player progress API (spec §63, §70, §91).
 *
 * Every call degrades gracefully: if the backend is unreachable, callers fall
 * back to local generation / localStorage so the game stays playable offline.
 */
import api from './apiClient.js';

export function fetchLevels() {
  return api('/levels');
}

export function fetchLevel(id) {
  return api(`/levels/${id}`);
}

/** Start a server-tracked session; returns a sessionToken used at completion. */
export function startSession(levelNumber) {
  return api('/games/start', { method: 'POST', auth: true, body: { levelNumber } });
}

/**
 * Complete a session. The client sends what happened; the SERVER recomputes and
 * validates the score (spec §64) — the client total is only a hint.
 */
export function completeSession(payload) {
  return api('/games/complete', { method: 'POST', auth: true, body: payload });
}

export function fetchHistory() {
  return api('/games/history', { auth: true });
}

export function fetchProgress() {
  return api('/player/progress', { auth: true });
}
