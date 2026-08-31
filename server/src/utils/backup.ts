import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool } from '../database/schema';

const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');
const KEEP = 7;

const TABLE_ORDER = [
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

async function columnNames(table: string): Promise<string[]> {
  const r = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = $1 AND table_schema = 'public' ORDER BY ordinal_position`,
    [table]
  );
  return r.rows.map((x) => x.column_name);
}

async function backup() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(BACKUP_DIR, `fred-${stamp}.json`);

  const data: Record<string, { columns: string[]; rows: any[][] }> = {};
  for (const table of TABLE_ORDER) {
    const cols = await columnNames(table);
    if (cols.length === 0) continue;
    const r = await pool.query(`SELECT * FROM "${table}"`);
    data[table] = { columns: cols, rows: r.rows.map((row) => cols.map((c) => row[c])) };
  }

  const payload = {
    created_at: new Date().toISOString(),
    database_name: 'fred',
    tables: data,
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Backup written: ${file}`);

  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('fred-') && f.endsWith('.json'))
    .map((f) => ({ f, t: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  for (let i = KEEP; i < files.length; i++) fs.unlinkSync(path.join(BACKUP_DIR, files[i].f));
  await pool.end();
}

backup().catch(async (e) => {
  console.error('Backup failed:', e);
  try { await pool.end(); } catch {}
  process.exit(1);
});