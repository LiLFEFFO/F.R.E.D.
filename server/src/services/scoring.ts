import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/schema';

export async function getPointsForPosition(scoringId: string, position: number): Promise<number> {
  const system = await db.queryOne('SELECT * FROM scoring_systems WHERE id = $1', [scoringId]) as any;
  if (!system) return 0;
  const points = JSON.parse(system.position_points);
  return points[position - 1] || 0;
}

export async function recalculateChampionship(championshipId: string): Promise<void> {
  try {
  const scoring = await db.queryOne('SELECT * FROM scoring_systems WHERE championship_id = $1', [championshipId]) as any;
  if (!scoring) { console.warn(`No scoring system for championship ${championshipId}`); return; }

  const drivers = await db.query('SELECT * FROM drivers WHERE championship_id = $1', [championshipId]) as any[];
  const teams = await db.query('SELECT * FROM teams WHERE championship_id = $1', [championshipId]) as any[];
  const races = await db.query('SELECT * FROM races WHERE championship_id = $1 AND status = $2', [championshipId, 'completed']) as any[];

  const driverStats: Record<string, { points: number; wins: number; podiums: number; poles: number; fastestLaps: number; racesDone: number }> = {};
  const teamStats: Record<string, number> = {};

  for (const d of drivers) {
    driverStats[d.id] = { points: 0, wins: 0, podiums: 0, poles: 0, fastestLaps: 0, racesDone: 0 };
  }
  for (const t of teams) {
    teamStats[t.id] = 0;
  }

  for (const race of races) {
    const results = await db.query('SELECT rr.*, rr.team_id FROM race_results rr WHERE rr.race_id = $1 ORDER BY rr.position ASC', [race.id]) as any[];
    for (const r of results) {
      const ds = driverStats[r.driver_id];
      if (!ds) continue;
      ds.points += r.points;
      ds.racesDone += 1;
      if (r.position === 1) ds.wins += 1;
      if (r.position <= 3) ds.podiums += 1;
      if (r.pole_position) ds.poles += 1;
      if (r.fastest_lap) ds.fastestLaps += 1;

      if (r.team_id && teamStats[r.team_id] !== undefined) {
        teamStats[r.team_id] += r.points;
      }
    }

    const sprintRes = await db.query('SELECT sr.*, sr.team_id FROM sprint_results sr WHERE sr.race_id = $1 ORDER BY sr.position ASC', [race.id]) as any[];
    for (const sr of sprintRes) {
      const ds = driverStats[sr.driver_id];
      if (!ds) continue;
      ds.points += sr.points;
      ds.racesDone += 1;
      if (sr.fastest_lap) ds.fastestLaps += 1;

      if (sr.team_id && teamStats[sr.team_id] !== undefined) {
        teamStats[sr.team_id] += sr.points;
      }
    }
  }

  const sortedDrivers = Object.entries(driverStats)
    .map(([id, stats]) => ({ id, ...stats }))
    .sort((a, b) => b.points - a.points);

  const existing = await db.query('SELECT driver_id, position FROM driver_standings WHERE championship_id = $1', [championshipId]) as any[];
  const prevPositions: Record<string, number> = {};
  for (const e of existing) prevPositions[e.driver_id] = e.position;

  await db.execute('DELETE FROM driver_standings WHERE championship_id = $1', [championshipId]);

  for (let i = 0; i < sortedDrivers.length; i++) {
    const d = sortedDrivers[i];
    const prev = prevPositions[d.id] || 0;
    await db.execute(`
      INSERT INTO driver_standings (id, championship_id, driver_id, points, wins, podiums, poles, fastest_laps, position, previous_position, races_done, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    `, [uuidv4(), championshipId, d.id, d.points, d.wins, d.podiums, d.poles, d.fastestLaps, i + 1, prev, d.racesDone]);
  }

  const sortedTeams = Object.entries(teamStats)
    .map(([id, points]) => ({ id, points }))
    .sort((a, b) => b.points - a.points);

  const existingTeams = await db.query('SELECT team_id, position FROM constructor_standings WHERE championship_id = $1', [championshipId]) as any[];
  const prevTeamPos: Record<string, number> = {};
  for (const e of existingTeams) prevTeamPos[e.team_id] = e.position;

  await db.execute('DELETE FROM constructor_standings WHERE championship_id = $1', [championshipId]);

  for (let i = 0; i < sortedTeams.length; i++) {
    const t = sortedTeams[i];
    const prev = prevTeamPos[t.id] || 0;
    await db.execute(`
      INSERT INTO constructor_standings (id, championship_id, team_id, points, position, previous_position, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [uuidv4(), championshipId, t.id, t.points, i + 1, prev]);
  }
  } catch (err) {
    console.error(`Error recalculating championship ${championshipId}:`, err);
  }
}
