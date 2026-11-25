/** GameSession model (spec §69). One record per play attempt. */
import mongoose from 'mongoose';

const gameSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    levelNumber: { type: Number, required: true },
    sessionToken: { type: String, required: true, unique: true, index: true },

    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },

    shotsUsed: { type: Number, default: 0 },
    bubblesPopped: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    stars: { type: Number, default: 0 },
    bestCombo: { type: Number, default: 0 },
    rescued: { type: Number, default: 0 },
    boostersUsed: { type: Number, default: 0 },

    completed: { type: Boolean, default: false },
    // open | completed | failed | invalid
    status: { type: String, enum: ['open', 'completed', 'failed', 'invalid'], default: 'open' },
    flagged: { type: Boolean, default: false },
    flagReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('GameSession', gameSessionSchema);
