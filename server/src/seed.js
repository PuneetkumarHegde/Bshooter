/**
 * seed.js — Seeds the database (spec §66, §92).
 *
 * - Inserts the achievement catalog.
 * - Inserts/updates the 40-level campaign (data-driven, generated).
 * - Optionally bootstraps an admin user from ADMIN_EMAIL / ADMIN_PASSWORD.
 *
 * Run with:  npm run seed
 */
import mongoose from 'mongoose';
import { config, GAME_NAME } from './config/gameConfig.js';
import { connectDb, isDbReady } from './config/db.js';
import Level from './models/Level.js';
import Achievement from './models/Achievement.js';
import User from './models/User.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { generateLevel, CAMPAIGN_LEVEL_COUNT } from './data/levelGenerator.js';

async function run() {
  await connectDb();
  if (!isDbReady()) {
    console.error('[seed] No database connection. Set MONGODB_URI in server/.env and retry.');
    process.exit(1);
  }

  console.log(`[seed] Seeding "${GAME_NAME}"…`);

  // Achievements
  for (const a of ACHIEVEMENTS) {
    await Achievement.updateOne({ key: a.key }, { $set: a }, { upsert: true });
  }
  console.log(`[seed] Achievements: ${ACHIEVEMENTS.length}`);

  // Campaign levels (data-driven)
  let count = 0;
  for (let n = 1; n <= CAMPAIGN_LEVEL_COUNT; n++) {
    const lvl = generateLevel(n);
    await Level.updateOne({ levelNumber: n }, { $set: lvl }, { upsert: true });
    count++;
  }
  console.log(`[seed] Levels: ${count}`);

  // Admin bootstrap (optional)
  if (config.adminEmail && config.adminPassword) {
    let admin = await User.findOne({ email: config.adminEmail.toLowerCase() });
    if (!admin) {
      admin = new User({ name: 'Admin', email: config.adminEmail.toLowerCase(), role: 'admin' });
      await admin.setPassword(config.adminPassword);
      await admin.save();
      console.log(`[seed] Admin created: ${config.adminEmail}`);
    } else {
      admin.role = 'admin';
      await admin.save();
      console.log(`[seed] Admin ensured: ${config.adminEmail}`);
    }
  } else {
    console.log('[seed] Skipped admin (set ADMIN_EMAIL + ADMIN_PASSWORD to create one).');
  }

  await mongoose.disconnect();
  console.log('[seed] Done.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
