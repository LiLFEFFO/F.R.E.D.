import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { readdirSync } from 'fs';
import { pool } from '../database/schema';
import { initSchema } from '../database/schema';

const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');
const ORDER = [
  'users',
  'championships',
  'scoring_systems',
  'teams',
  'drivers',
  'races',
  'race_results',
  'sprint_results',
  'driver_standings',
  'constructor_standings',
  'notifications',
  'badges',
  'season_archives',
  'championship_collaborators',
  'news',
];

async function restore(file?: string) {
  if (process.env.ALLOW_RESTORE !== '1') {
    throw new Error('Restore aborted: set ALLOW_RESTORE=1 to confirm this DESTRUCTIVE operation.');
  }
  const target = file || pickLatest();
  if (!target) throw new Error('No backup found.');
  const fp = path.join(BACKUP_DIR, target);
  if (!fs.existsSync(fp)) throw new Error(`Backup not found: ${fp}`);
  const backup = JSON.parse(fs.readFileSync(fp, 'utf8'));

  console.log('Restoring from', target);
  await pool.query('DROP SCHEMA public CASCADE');
  await pool.query('CREATE SCHEMA public');
  await initSchema();

  for (const table of ORDER) {
    const t = backup.tables?.[table];
    if (!t || t.rows.length === 0) continue;
    const cols = t.columns.map((c: string) => `"${c}"`);
    const placeholders = t.columns.map((_: string, i: number) => `$${i + 1}`).join(', ');
    const colList = cols.join(', ');
    for (const row of t.rows) {
      await pool.query(`INSERT INTO "${table}" (${colList}) VALUES (${placeholders})`, row);
    }
    console.log(`  restored ${table}: ${t.rows.length} rows`);
  }
  await pool.end();
  console.log('Restore complete.');
}

function pickLatest(): string | undefined {
  const files = readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('fred-') && f.endsWith('.json'))
    .sort().reverse();
  return files[0];
}

const arg = process.argv[2];
restore(arg)
  .catch(async (e) => {
    console.error('Restore failed:', e.message || e);
    try { await pool.end(); } catch {}
    process.exit(1);
  });