/** server.js — Entry point: connect DB (optional) and start the HTTP server. */
import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { config, GAME_NAME } from './config/gameConfig.js';

async function main() {
  await connectDb(); // non-fatal if MONGODB_URI is missing

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`\n🫧  ${GAME_NAME} API running on http://localhost:${config.port}`);
    console.log(`    Environment: ${config.nodeEnv}`);
    console.log(`    API base:    http://localhost:${config.port}/api\n`);
  });
}

main().catch((err) => {
  console.error('[fatal] Failed to start server:', err);
  process.exit(1);
});
