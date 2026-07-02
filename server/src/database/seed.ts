import 'dotenv/config';
import { initSchema, db } from './schema';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  await initSchema();

  const adminId = uuidv4();
  await db.execute(
    'INSERT INTO users (id, username, email, password, role, discord_id) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (username) DO NOTHING',
    [adminId, 'LiLFEFFO', 'admin@fred.com', bcrypt.hashSync('admin123', 10), 'elite', '@LiLFEFFO']
  );

  const userId = uuidv4();
  await db.execute(
    'INSERT INTO users (id, username, email, password, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO NOTHING',
    [userId, 'racer1', 'racer@fred.com', bcrypt.hashSync('racer123', 10), 'standard']
  );

  const champId = uuidv4();
  await db.execute(
    `INSERT INTO championships (id, name, season, description, rules, max_participants, created_by, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active') ON CONFLICT (id) DO NOTHING`,
    [champId, 'F.R.E.D. Racing Championship', '2026',
     'Il campionato automobilistico più completo della scena virtuale. Benvenuti a bordo.',
     '1. Sistema di punteggio standard F1\n2. Pole position: 1 punto bonus\n3. Giro veloce: 1 punto bonus\n4. A parità di punti, vince chi ha più vittorie\n5. Obbligatoria presenza al 75% delle gare per la classifica costruttori',
     30, adminId]
  );

  const scoringId = uuidv4();
  await db.execute(
    'INSERT INTO scoring_systems (id, championship_id, position_points, pole_bonus, fastest_lap_bonus) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
    [scoringId, champId, JSON.stringify([25, 18, 15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), 1, 1]
  );

  const teams = [
    { id: uuidv4(), name: 'Scuderia Ferrari', color: '#e10600' },
    { id: uuidv4(), name: 'Red Bull Racing', color: '#1e41c2' },
    { id: uuidv4(), name: 'Mercedes-AMG', color: '#00a19c' },
    { id: uuidv4(), name: 'McLaren Racing', color: '#ff8700' },
  ];
  for (const t of teams) {
    await db.execute(
      'INSERT INTO teams (id, championship_id, name, color) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
      [t.id, champId, t.name, t.color]
    );
  }

  const drivers = [
    { id: uuidv4(), name: 'Charles Leclerc', team: teams[0].id, number: 16 },
    { id: uuidv4(), name: 'Carlos Sainz', team: teams[0].id, number: 55 },
    { id: uuidv4(), name: 'Max Verstappen', team: teams[1].id, number: 1 },
    { id: uuidv4(), name: 'Sergio Perez', team: teams[1].id, number: 11 },
    { id: uuidv4(), name: 'Lewis Hamilton', team: teams[2].id, number: 44 },
    { id: uuidv4(), name: 'George Russell', team: teams[2].id, number: 63 },
    { id: uuidv4(), name: 'Lando Norris', team: teams[3].id, number: 4 },
    { id: uuidv4(), name: 'Oscar Piastri', team: teams[3].id, number: 81 },
  ];
  for (const d of drivers) {
    await db.execute(
      'INSERT INTO drivers (id, championship_id, name, number, team_id, user_id) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
      [d.id, champId, d.name, d.number, d.team, d.name === 'Max Verstappen' ? adminId : null]
    );
  }

  const races = [
    { id: uuidv4(), name: 'Bahrain GP', circuit: 'Bahrain International Circuit', date: '2026-03-15' },
    { id: uuidv4(), name: 'Saudi Arabian GP', circuit: 'Jeddah Corniche Circuit', date: '2026-03-29' },
    { id: uuidv4(), name: 'Australian GP', circuit: 'Albert Park Circuit', date: '2026-04-12' },
    { id: uuidv4(), name: 'Italian GP', circuit: 'Autodromo Nazionale Monza', date: '2026-09-07' },
  ];
  for (const r of races) {
    await db.execute(
      "INSERT INTO races (id, championship_id, name, circuit, date, status) VALUES ($1, $2, $3, $4, $5, 'completed') ON CONFLICT (id) DO NOTHING",
      [r.id, champId, r.name, r.circuit, r.date]
    );
  }

  const pointsArray = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

  const results = [
    { race: races[0].id, driver: drivers[2].id, pos: 1, pole: 1, fl: 0 },
    { race: races[0].id, driver: drivers[0].id, pos: 2, pole: 0, fl: 1 },
    { race: races[0].id, driver: drivers[4].id, pos: 3, pole: 0, fl: 0 },
    { race: races[0].id, driver: drivers[6].id, pos: 4, pole: 0, fl: 0 },
    { race: races[0].id, driver: drivers[1].id, pos: 5, pole: 0, fl: 0 },
    { race: races[0].id, driver: drivers[3].id, pos: 6, pole: 0, fl: 0 },
    { race: races[0].id, driver: drivers[5].id, pos: 7, pole: 0, fl: 0 },
    { race: races[0].id, driver: drivers[7].id, pos: 8, pole: 0, fl: 0 },
    { race: races[1].id, driver: drivers[0].id, pos: 1, pole: 1, fl: 0 },
    { race: races[1].id, driver: drivers[2].id, pos: 2, pole: 0, fl: 1 },
    { race: races[1].id, driver: drivers[6].id, pos: 3, pole: 0, fl: 0 },
    { race: races[1].id, driver: drivers[4].id, pos: 4, pole: 0, fl: 0 },
    { race: races[1].id, driver: drivers[5].id, pos: 5, pole: 0, fl: 0 },
    { race: races[1].id, driver: drivers[1].id, pos: 6, pole: 0, fl: 0 },
    { race: races[1].id, driver: drivers[3].id, pos: 7, pole: 0, fl: 0 },
    { race: races[1].id, driver: drivers[7].id, pos: 8, pole: 0, fl: 0 },
    { race: races[2].id, driver: drivers[2].id, pos: 1, pole: 1, fl: 1 },
    { race: races[2].id, driver: drivers[6].id, pos: 2, pole: 0, fl: 0 },
    { race: races[2].id, driver: drivers[0].id, pos: 3, pole: 0, fl: 0 },
    { race: races[2].id, driver: drivers[4].id, pos: 4, pole: 0, fl: 0 },
    { race: races[2].id, driver: drivers[5].id, pos: 5, pole: 0, fl: 0 },
    { race: races[2].id, driver: drivers[1].id, pos: 6, pole: 0, fl: 0 },
    { race: races[2].id, driver: drivers[7].id, pos: 7, pole: 0, fl: 0 },
    { race: races[2].id, driver: drivers[3].id, pos: 8, pole: 0, fl: 0 },
    { race: races[3].id, driver: drivers[6].id, pos: 1, pole: 0, fl: 1 },
    { race: races[3].id, driver: drivers[2].id, pos: 2, pole: 1, fl: 0 },
    { race: races[3].id, driver: drivers[0].id, pos: 3, pole: 0, fl: 0 },
    { race: races[3].id, driver: drivers[4].id, pos: 4, pole: 0, fl: 0 },
    { race: races[3].id, driver: drivers[1].id, pos: 5, pole: 0, fl: 0 },
    { race: races[3].id, driver: drivers[5].id, pos: 6, pole: 0, fl: 0 },
    { race: races[3].id, driver: drivers[3].id, pos: 7, pole: 0, fl: 0 },
    { race: races[3].id, driver: drivers[7].id, pos: 8, pole: 0, fl: 0 },
  ];

  for (const r of results) {
    let pts = pointsArray[r.pos - 1] || 0;
    if (r.pole) pts += 1;
    if (r.fl) pts += 1;
    await db.execute(
      'INSERT INTO race_results (id, race_id, driver_id, position, points, pole_position, fastest_lap) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
      [uuidv4(), r.race, r.driver, r.pos, pts, r.pole, r.fl]
    );
  }

  const { recalculateChampionship } = await import('../services/scoring');
  await recalculateChampionship(champId);

  console.log('Database seeded successfully!');
  console.log('');
  console.log('Admin account (ELITE):');
  console.log('  Email: admin@fred.com');
  console.log('  Password: admin123');
  console.log('');
  console.log('Standard account:');
  console.log('  Email: racer@fred.com');
  console.log('  Password: racer123');
}

main().catch(console.error);
