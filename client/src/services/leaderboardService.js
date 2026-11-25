/** leaderboardService.js — Leaderboard, achievements, daily challenge (spec §71–74, §91). */
import api from './apiClient.js';

export function fetchLeaderboard(scope = 'global') {
  return api(`/leaderboard?scope=${encodeURIComponent(scope)}`);
}

export function fetchMyRank() {
  return api('/leaderboard/me', { auth: true });
}

export function fetchAchievements() {
  return api('/achievements');
}

export function fetchMyAchievements() {
  return api('/achievements/me', { auth: true });
}

export function fetchDailyChallenge() {
  return api('/daily-challenge');
}

export function completeDailyChallenge(payload) {
  return api('/daily-challenge/complete', { method: 'POST', auth: true, body: payload });
}
