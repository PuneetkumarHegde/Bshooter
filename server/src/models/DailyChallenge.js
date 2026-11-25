/** DailyChallenge model (spec §74). One puzzle per calendar day. */
import mongoose from 'mongoose';

const dailyChallengeSchema = new mongoose.Schema({
  day: { type: String, required: true, unique: true, index: true }, // YYYY-MM-DD
  title: { type: String, default: 'Daily Challenge' },
  level: { type: mongoose.Schema.Types.Mixed, required: true },
  reward: { type: String, default: '+500 coins, +1 booster' },
  completions: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      score: Number,
      completedAt: { type: Date, default: Date.now },
    },
  ],
});

export default mongoose.model('DailyChallenge', dailyChallengeSchema);
