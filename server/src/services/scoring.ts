import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from '../database/schema';

export function getPointsForPosition(scoringId: string, position: number): number {
  const db = getDb();
  const system = db.prepare('SELECT * FROM scoring_systems WHERE id = ?').get(scoringId) as any;
  if (!system) return 0;
  const points = JSON.parse(system.position_points);
  return points[position - 1] || 0;
}

export function recalculateChampionship(championshipId: string): void {
  const db = getDb();

  const scoring = db.prepare('SELECT * FROM scoring_systems WHERE championship_id = ?').get(championshipId) as any;
  if (!scoring) return;

  const drivers = db.prepare('SELECT * FROM drivers WHERE championship_id = ?').all(championshipId) as any[];
  const teams = db.prepare('SELECT * FROM teams WHERE championship_id = ?').all(championshipId) as any[];
  const races = db.prepare("SELECT * FROM races WHERE championship_id = ? AND status = ?").all(championshipId, 'completed') as any[];

  const driverStats: Record<string, { points: number; wins: number; podiums: number; poles: number; fastestLaps: number; racesDone: number }> = {};
  const teamStats: Record<string, number> = {};

  for (const d of drivers) {
    driverStats[d.id] = { points: 0, wins: 0, podiums: 0, poles: 0, fastestLaps: 0, racesDone: 0 };
    if (d.team_id) teamStats[d.team_id] = 0;
  }

  for (const race of races) {
    const results = db.prepare('SELECT * FROM race_results WHERE race_id = ? ORDER BY position ASC').all(race.id) as any[];
    for (const r of results) {
      const ds = driverStats[r.driver_id];
      if (!ds) continue;
      ds.points += r.points;
      ds.racesDone += 1;
      if (r.position === 1) ds.wins += 1;
      if (r.position <= 3) ds.podiums += 1;
      if (r.pole_position) ds.poles += 1;
      if (r.fastest_lap) ds.fastestLaps += 1;

      const driver = db.prepare('SELECT team_id FROM drivers WHERE id = ?').get(r.driver_id) as any;
      if (driver?.team_id && teamStats[driver.team_id] !== undefined) {
        teamStats[driver.team_id] += r.points;
      }
    }
  }

  const sortedDrivers = Object.entries(driverStats)
    .map(([id, stats]) => ({ id, ...stats }))
    .sort((a, b) => b.points - a.points);

  const existing = db.prepare('SELECT driver_id, position FROM driver_standings WHERE championship_id = ?').all(championshipId) as any[];
  const prevPositions: Record<string, number> = {};
  for (const e of existing) prevPositions[e.driver_id] = e.position;

  db.prepare('DELETE FROM driver_standings WHERE championship_id = ?').run(championshipId);

  const insertStanding = db.prepare(`
    INSERT INTO driver_standings (id, championship_id, driver_id, points, wins, podiums, poles, fastest_laps, position, previous_position, races_done, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  sortedDrivers.forEach((d, idx) => {
    const prev = prevPositions[d.id] || 0;
    insertStanding.run(uuidv4(), championshipId, d.id, d.points, d.wins, d.podiums, d.poles, d.fastestLaps, idx + 1, prev, d.racesDone);
  });

  const sortedTeams = Object.entries(teamStats)
    .map(([id, points]) => ({ id, points }))
    .sort((a, b) => b.points - a.points);

  const existingTeams = db.prepare('SELECT team_id, position FROM constructor_standings WHERE championship_id = ?').all(championshipId) as any[];
  const prevTeamPos: Record<string, number> = {};
  for (const e of existingTeams) prevTeamPos[e.team_id] = e.position;

  db.prepare('DELETE FROM constructor_standings WHERE championship_id = ?').run(championshipId);

  const insertConstructor = db.prepare(`
    INSERT INTO constructor_standings (id, championship_id, team_id, points, position, previous_position, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  sortedTeams.forEach((t, idx) => {
    const prev = prevTeamPos[t.id] || 0;
    insertConstructor.run(uuidv4(), championshipId, t.id, t.points, idx + 1, prev);
  });

  saveDb();
}
