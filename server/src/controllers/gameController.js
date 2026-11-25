/**
 * gameController.js — Game session lifecycle with SERVER-SIDE validation
 * (spec §63 sessions, §64 validation, §65 anti-cheat).
 */
import GameSession from '../models/GameSession.js';
import { asyncHandler, randomToken } from '../utils/asyncHandler.js';
import { getLevel } from '../services/levelService.js';
import { validateScore } from '../services/scoreValidator.js';
import { checkSession, checkLevelId, checkPlausibility } from '../services/antiCheat.js';
import { evaluateAchievements } from '../services/achievementService.js';

export const startGame = asyncHandler(async (req, res) => {
  const levelNumber = parseInt(req.body?.levelNumber, 10);
  const idCheck = checkLevelId(levelNumber);
  if (!idCheck.ok) return res.status(400).json({ message: idCheck.reason });

  const sessionToken = randomToken();
  const session = await GameSession.create({
    userId: req.user._id,
    levelNumber,
    sessionToken,
    startedAt: new Date(),
    status: 'open',
  });

  res.status(201).json({ sessionToken, sessionId: session._id, startedAt: session.startedAt });
});

export const completeGame = asyncHandler(async (req, res) => {
  const sub = {
    sessionToken: req.body?.sessionToken,
    levelNumber: parseInt(req.body?.levelNumber, 10),
    score: Number(req.body?.score) || 0,
    stars: Number(req.body?.stars) || 0,
    shotsUsed: Number(req.body?.shotsUsed) || 0,
    bubblesPopped: Number(req.body?.bubblesPopped) || 0,
    bestCombo: Number(req.body?.bestCombo) || 0,
    rescued: Number(req.body?.rescued) || 0,
    boostersUsed: Number(req.body?.boostersUsed) || 0,
    completed: req.body?.completed !== false,
  };

  const idCheck = checkLevelId(sub.levelNumber);
  if (!idCheck.ok) return res.status(400).json({ message: idCheck.reason });
  if (!sub.sessionToken) return res.status(400).json({ message: 'Missing session token' });

  const session = await GameSession.findOne({ sessionToken: sub.sessionToken });
  const sessionCheck = checkSession(session, req.user, sub);
  if (!sessionCheck.ok) return res.status(400).json({ message: sessionCheck.reason });

  const level = await getLevel(sub.levelNumber);

  // Anti-cheat: shot count + timing plausibility.
  const plaus = checkPlausibility(level, session, sub);
  if (!plaus.ok) {
    session.status = 'invalid';
    session.flagged = true;
    session.flagReason = plaus.reason;
    await session.save();
    return res.status(400).json({ message: `Result rejected: ${plaus.reason}`, serverValidated: true });
  }

  // Recompute / validate the score server-side (spec §64).
  const validation = validateScore(level, sub);
  if (!validation.valid) {
    session.status = 'invalid';
    session.flagged = true;
    session.flagReason = validation.reason;
    await session.save();
    return res.status(400).json({ message: `Result rejected: ${validation.reason}`, serverValidated: true });
  }

  const acceptedScore = validation.acceptedScore;
  const stars = validation.stars;

  // Persist the session outcome.
  session.completed = sub.completed;
  session.status = sub.completed ? 'completed' : 'failed';
  session.completedAt = new Date();
  session.score = acceptedScore;
  session.stars = stars;
  session.shotsUsed = sub.shotsUsed;
  session.bubblesPopped = sub.bubblesPopped;
  session.bestCombo = sub.bestCombo;
  session.rescued = sub.rescued;
  session.boostersUsed = sub.boostersUsed;
  await session.save();

  const user = req.user;
  let newHighScore = false;

  if (sub.completed) {
    // Update best stars/score for this level (spec §70 persistence).
    const existing = user.completedLevels.find((c) => c.levelNumber === sub.levelNumber);
    if (existing) {
      if (acceptedScore > existing.bestScore) {
        existing.bestScore = acceptedScore;
        newHighScore = true;
      }
      existing.stars = Math.max(existing.stars, stars);
    } else {
      user.completedLevels.push({ levelNumber: sub.levelNumber, stars, bestScore: acceptedScore });
      newHighScore = true;
    }

    // Recompute aggregate totals from the authoritative per-level bests.
    user.totalScore = user.completedLevels.reduce((s, c) => s + (c.bestScore || 0), 0);
    user.totalStars = user.completedLevels.reduce((s, c) => s + (c.stars || 0), 0);
    user.currentLevel = Math.max(user.currentLevel, sub.levelNumber + 1);
  }

  user.bubblesPopped += sub.bubblesPopped;
  user.rescuedObjects += sub.rescued;
  user.bestCombo = Math.max(user.bestCombo, sub.bestCombo);
  user.boostersUsed += sub.boostersUsed;
  await user.save();

  const perfect = sub.completed && sub.shotsUsed <= Math.ceil(level.shots * 0.6);
  const newAchievements = await evaluateAchievements(user, { perfect });

  res.json({
    serverValidated: true,
    score: acceptedScore,
    stars,
    newHighScore,
    newAchievements,
    totals: { totalScore: user.totalScore, totalStars: user.totalStars, levelsCompleted: user.completedLevels.length },
  });
});

export const history = asyncHandler(async (req, res) => {
  const sessions = await GameSession.find({ userId: req.user._id, status: { $in: ['completed', 'failed'] } })
    .sort({ completedAt: -1, createdAt: -1 })
    .limit(20)
    .lean();
  res.json({ sessions });
});

export const getSession = asyncHandler(async (req, res) => {
  const session = await GameSession.findOne({ _id: req.params.id, userId: req.user._id }).lean();
  if (!session) return res.status(404).json({ message: 'Session not found' });
  res.json({ session });
});
