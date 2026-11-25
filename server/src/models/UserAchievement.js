/** UserAchievement model — which achievements a user has unlocked (spec §66). */
import mongoose from 'mongoose';

const userAchievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  key: { type: String, required: true },
  unlockedAt: { type: Date, default: Date.now },
});

userAchievementSchema.index({ userId: 1, key: 1 }, { unique: true });

export default mongoose.model('UserAchievement', userAchievementSchema);
