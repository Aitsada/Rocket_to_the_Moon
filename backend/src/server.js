import { app } from './app.js';
import { env } from './config/env.js';
import { runMigrations } from './db/migrate.js';

async function start() {
  if (env.autoMigrate) {
    await runMigrations();
  }

  app.listen(env.port, () => {
    console.log(`Rocket to the Moon API listening on port ${env.port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
