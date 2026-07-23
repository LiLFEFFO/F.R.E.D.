import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fred',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params).then(r => r.rows),
  queryOne: (text: string, params?: any[]) => pool.query(text, params).then(r => r.rows[0] || null),
  execute: (text: string, params?: any[]) => pool.query(text, params).then(r => ({ changes: r.rowCount })),
  pool,
};

export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'standard' CHECK(role IN ('standard','elite')),
      discord_id TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS scoring_systems (
      id TEXT PRIMARY KEY,
      championship_id TEXT NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
      position_points TEXT NOT NULL DEFAULT '[25,18,15,12,10,8,6,4,2,1]',
      sprint_points TEXT NOT NULL DEFAULT '[10,8,6,5,4,3,2,1]',
      pole_bonus INTEGER DEFAULT 0,
      fastest_lap_bonus INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      championship_id TEXT NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#e10600',
      logo TEXT DEFAULT '',
      livery TEXT DEFAULT '',
      reserve_driver_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      championship_id TEXT NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
      team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      number INTEGER NOT NULL,
      avatar TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS races (
      id TEXT PRIMARY KEY,
      championship_id TEXT NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      circuit TEXT NOT NULL,
      date TEXT NOT NULL,
      weather TEXT DEFAULT 'Dry',
      status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','in_progress','completed')),
      has_sprint INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
      present INTEGER NOT NULL DEFAULT 1,
      qualifying_position INTEGER DEFAULT NULL,
      penalties TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sprint_results (
      id TEXT PRIMARY KEY,
      race_id TEXT NOT NULL REFERENCES races(id) ON DELETE CASCADE,
      driver_id TEXT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      points REAL NOT NULL DEFAULT 0,
      dnf INTEGER NOT NULL DEFAULT 0,
      present INTEGER NOT NULL DEFAULT 1,
      fastest_lap INTEGER NOT NULL DEFAULT 0,
      penalties TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(championship_id, driver_id)
    );

    CREATE TABLE IF NOT EXISTS constructor_standings (
      id TEXT PRIMARY KEY,
      championship_id TEXT NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
      team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      points REAL NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      previous_position INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(championship_id, team_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      read INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      championship_id TEXT REFERENCES championships(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon TEXT DEFAULT '🏆',
      awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS season_archives (
      id TEXT PRIMARY KEY,
      championship_id TEXT NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
      season TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS championship_collaborators (
      id TEXT PRIMARY KEY,
      championship_id TEXT NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(championship_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS news (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      cover_image TEXT DEFAULT '',
      author_id TEXT REFERENCES users(id),
      published INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Migrations for existing tables
    ALTER TABLE races ADD COLUMN IF NOT EXISTS has_sprint INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE scoring_systems ADD COLUMN IF NOT EXISTS sprint_points TEXT NOT NULL DEFAULT '[10,8,6,5,4,3,2,1]';
    ALTER TABLE race_results ADD COLUMN IF NOT EXISTS team_id TEXT REFERENCES teams(id) ON DELETE SET NULL;
    ALTER TABLE sprint_results ADD COLUMN IF NOT EXISTS team_id TEXT REFERENCES teams(id) ON DELETE SET NULL;
    ALTER TABLE sprint_results ADD COLUMN IF NOT EXISTS fastest_lap INTEGER NOT NULL DEFAULT 0;
  `);
  console.log('Database schema initialized');
}
