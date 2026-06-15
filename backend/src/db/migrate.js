import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationPath = path.resolve(__dirname, '../../migrations/001_init.sql');

export async function runMigrations() {
  const sql = await fs.readFile(migrationPath, 'utf8');
  await pool.query(sql);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      console.log('Database migration complete');
      return pool.end();
    })
    .catch((error) => {
      console.error(error);
      return pool.end().finally(() => process.exit(1));
    });
}
