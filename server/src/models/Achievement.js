/** Achievement catalog model (spec §73). */
import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  desc: { type: String, required: true },
  icon: { type: String, default: '🏅' },
  // metric + threshold used by the evaluator
  metric: { type: String, required: true },
  threshold: { type: Number, required: true },
});

export default mongoose.model('Achievement', achievementSchema);
