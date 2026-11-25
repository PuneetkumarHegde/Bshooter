/**
 * antiCheat.js — Basic anti-cheat protections (spec §65).
 *
 * Detects: session ownership mismatch, reused/duplicate sessions, invalid level
 * IDs, excessive shots, and impossible completion times.
 */

export function checkSession(session, user, sub) {
  if (!session) return { ok: false, reason: 'Unknown game session' };
  if (String(session.userId) !== String(user._id)) {
    return { ok: false, reason: 'Session does not belong to this player' };
  }
  if (session.status !== 'open') {
    return { ok: false, reason: 'This session was already submitted' };
  }
  if (session.levelNumber !== sub.levelNumber) {
    return { ok: false, reason: 'Level mismatch for this session' };
  }
  return { ok: true };
}

export function checkLevelId(levelNumber) {
  if (!Number.isInteger(levelNumber) || levelNumber < 1 || levelNumber > 100000) {
    return { ok: false, reason: 'Invalid level id' };
  }
  return { ok: true };
}

export function checkPlausibility(level, session, sub) {
  const maxShots = level.shots + (sub.boostersUsed || 0) * 5 + 2;
  if ((sub.shotsUsed || 0) > maxShots) {
    return { ok: false, reason: 'Excessive shot count' };
  }

  // Impossible completion time: a human cannot complete faster than ~150ms/shot.
  const durationMs = Date.now() - new Date(session.startedAt).getTime();
  const minMs = Math.max(500, (sub.shotsUsed || 0) * 150);
  if (durationMs < minMs) {
    return { ok: false, reason: 'Impossible completion time' };
  }
  return { ok: true };
}

export default { checkSession, checkLevelId, checkPlausibility };
