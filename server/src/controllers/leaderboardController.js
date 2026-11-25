/** leaderboardController.js — Global / weekly / monthly / friends boards (spec §71, §72). */
import mongoose from 'mongoose';
import User from '../models/User.js';
import GameSession from '../models/GameSession.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function sinceFor(scope) {
  const now = Date.now();
  if (scope === 'weekly') return new Date(now - 7 * 864e5);
  if (scope === 'monthly') return new Date(now - 30 * 864e5);
  return null;
}

export const getLeaderboard = asyncHandler(async (req, res) => {
  const scope = String(req.query.scope || 'global');
  const myId = req.user?._id?.toString();

  let leaderboard;
  const since = sinceFor(scope);

  if (since) {
    // Time-boxed: sum validated session scores in the window.
    const rows = await GameSession.aggregate([
      { $match: { status: 'completed', completedAt: { $gte: since } } },
      { $group: { _id: '$userId', score: { $sum: '$score' }, stars: { $sum: '$stars' } } },
      { $sort: { score: -1 } },
      { $limit: 50 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { _id: 1, score: 1, stars: 1, name: '$user.name', bestCombo: '$user.bestCombo' } },
    ]);
    leaderboard = rows.map((r) => ({
      userId: r._id,
      name: r.name,
      score: r.score,
      totalStars: r.stars,
      bestCombo: r.bestCombo,
      isMe: myId && String(r._id) === myId,
    }));
  } else {
    // Global: lifetime totals straight off the user document.
    const users = await User.find().sort({ totalScore: -1 }).limit(50).lean();
    leaderboard = users.map((u) => ({
      userId: u._id,
      name: u.name,
      score: u.totalScore,
      totalStars: u.totalStars,
      bestCombo: u.bestCombo,
      isMe: myId && String(u._id) === myId,
    }));
  }

  res.json({ scope, leaderboard });
});

export const getMyRank = asyncHandler(async (req, res) => {
  const me = req.user;
  const higher = await User.countDocuments({ totalScore: { $gt: me.totalScore } });
  res.json({ rank: higher + 1, score: me.totalScore, totalStars: me.totalStars });
});
