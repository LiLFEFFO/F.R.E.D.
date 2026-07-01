import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '..', '..', 'fred.db');

let db: any = null;
let SQL: any = null;

function createHelpers(database: any) {
  const prepare = (sql: string) => {
    return {
      all: (...params: any[]) => {
        const s = database.prepare(sql);
        if (params.length > 0) s.bind(params);
        const rows: any[] = [];
        while (s.step()) rows.push(s.getAsObject());
        s.free();
        return rows;
      },
      get: (...params: any[]) => {
        const s = database.prepare(sql);
        if (params.length > 0) s.bind(params);
        const result = s.step() ? s.getAsObject() : null;
        s.free();
        return result;
      },
      run: (...params: any[]) => {
        const s = database.prepare(sql);
        if (params.length > 0) s.bind(params);
        s.step();
        s.free();
        return { changes: database.getRowsModified() };
      },
    };
  };

  return {
    prepare,
    exec: (sql: string) => database.exec(sql),
    run: (sql: string, params?: any[]) => {
      const s = database.prepare(sql);
      if (params) s.bind(params);
      s.step();
      s.free();
      return { changes: database.getRowsModified() };
    },
    getRowsModified: () => database.getRowsModified(),
    save: () => {
      const data = database.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    },
    close: () => { database.close(); },
  };
}

export async function getDbAsync() {
  if (db) return db;
  if (!SQL) SQL = await initSqlJs();

  let database: any;
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    database = new SQL.Database(fileBuffer);
  } else {
    database = new SQL.Database();
  }

  database.run('PRAGMA journal_mode=WAL');
  database.run('PRAGMA foreign_keys=ON');

  db = createHelpers(database);
  initSchema();
  return db;
}

export function getDb(): any {
  if (!db) throw new Error('Database not initialized. Call getDbAsync() first.');
  return db;
}

let schemaInitialized = false;

function initSchema() {
  if (schemaInitialized) return;
  schemaInitialized = true;
  const d = db;
  try { d.run('ALTER TABLE championships ADD COLUMN status TEXT NOT NULL DEFAULT \'active\'', []); } catch (e) {}
  try { d.run('ALTER TABLE teams ADD COLUMN livery TEXT DEFAULT \'\'', []); } catch (e) {}
  try { d.run('ALTER TABLE news ADD COLUMN cover_image TEXT DEFAULT \'\'', []); } catch (e) {}
  try { d.run('ALTER TABLE race_results ADD COLUMN qualifying_position INTEGER DEFAULT NULL', []); } catch (e) {}
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'standard' CHECK(role IN ('standard','elite')),
      discord_id TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS championships (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      season TEXT NOT NULL,
      description TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      rules TEXT DEFAULT '',
      max_participants INTEGER DEFAULT 30,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','concluded')),
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scoring_systems (
      id TEXT PRIMARY KEY,
      championship_id TEXT NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
      position_points TEXT NOT NULL DEFAULT '[25,18,15,12,10,8,6,4,2,1]',
      pole_bonus INTEGER DEFAULT 0,
      fastest_lap_bonus INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      championship_id TEXT NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#e10600',
      logo TEXT DEFAULT '',
      livery TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      championship_id TEXT NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
      team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      number INTEGER NOT NULL,
      avatar TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS races (
      id TEXT PRIMARY KEY,
      championship_id TEXT NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      circuit TEXT NOT NULL,
      date TEXT NOT NULL,
      weather TEXT DEFAULT 'Dry',
      status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','in_progress','completed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS race_results (
      id TEXT PRIMARY KEY,
      race_id TEXT NOT NULL REFERENCES races(id) ON DELETE CASCADE,
      driver_id TEXT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      points REAL NOT NULL DEFAULT 0,
      pole_position INTEGER NOT NULL DEFAULT 0,
      fastest_lap INTEGER NOT NULL DEFAULT 0,
      dnf INTEGER NOT NULL DEFAULT 0,
      qualifying_position INTEGER DEFAULT NULL,
      penalties TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS driver_standings (
      id TEXT PRIMARY KEY,
      championship_id TEXT NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
      driver_id TEXT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
      points REAL NOT NULL DEFAULT 0,
      wins INTEGER NOT NULL DEFAULT 0,
      podiums INTEGER NOT NULL DEFAULT 0,
      poles INTEGER NOT NULL DEFAULT 0,
      fastest_laps INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      previous_position INTEGER NOT NULL DEFAULT 0,
      races_done INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(championship_id, driver_id)
    );

    CREATE TABLE IF NOT EXISTS constructor_standings (
      id TEXT PRIMARY KEY,
      championship_id TEXT NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
      team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      points REAL NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      previous_position INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(championship_id, team_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      championship_id TEXT REFERENCES championships(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon TEXT DEFAULT '🏆',
      awarded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS season_archives (
      id TEXT PRIMARY KEY,
      championship_id TEXT NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
      season TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS news (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      cover_image TEXT DEFAULT '',
      author_id TEXT REFERENCES users(id),
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export function saveDb() {
  if (db) db.save();
}
