/** User model (spec §67). Passwords are stored ONLY as bcrypt hashes. */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const completedLevelSchema = new mongoose.Schema(
  {
    levelNumber: { type: Number, required: true },
    stars: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['player', 'admin'], default: 'player' },

    currentLevel: { type: Number, default: 1 },
    completedLevels: { type: [completedLevelSchema], default: [] },

    totalScore: { type: Number, default: 0 },
    totalStars: { type: Number, default: 0 },
    bubblesPopped: { type: Number, default: 0 },
    bestCombo: { type: Number, default: 0 },
    rescuedObjects: { type: Number, default: 0 },
    boostersUsed: { type: Number, default: 0 },

    boosterInventory: {
      aim: { type: Number, default: 3 },
      bomb: { type: Number, default: 2 },
      rainbow: { type: Number, default: 2 },
      extraShot: { type: Number, default: 2 },
      shuffle: { type: Number, default: 1 },
    },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 10);
};

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

/** Public-safe projection (never leak the hash). */
userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    currentLevel: this.currentLevel,
    totalScore: this.totalScore,
    totalStars: this.totalStars,
    bubblesPopped: this.bubblesPopped,
    bestCombo: this.bestCombo,
    rescuedObjects: this.rescuedObjects,
    levelsCompleted: this.completedLevels.length,
    boosterInventory: this.boosterInventory,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('User', userSchema);
