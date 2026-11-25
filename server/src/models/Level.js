/** Level model (spec §68). Levels are data-driven and admin-editable. */
import mongoose from 'mongoose';

const levelSchema = new mongoose.Schema(
  {
    levelNumber: { type: Number, required: true, unique: true, index: true },
    difficulty: { type: String, default: 'easy' },
    objective: { type: mongoose.Schema.Types.Mixed, required: true },
    shots: { type: Number, required: true },
    colors: { type: [String], default: [] },
    boardLayout: { type: Array, default: [] },
    hiddenTargets: { type: Array, default: [] },
    bubbleQueue: { type: Array, default: [] },
    targetScore: { type: Number, default: 0 },
    starThresholds: { type: [Number], default: [] },
    availableBoosters: { type: [String], default: [] },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Level', levelSchema);
