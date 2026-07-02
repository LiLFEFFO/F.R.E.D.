import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/schema';
import { authenticate, requireElite, optionalAuth, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string || '';
  const status = req.query.status as string || '';
  const offset = (page - 1) * limit;

  let query = `SELECT c.*, u.username as organizer_name,
    (SELECT COUNT(*) FROM drivers WHERE championship_id = c.id)::int as driver_count,
    (SELECT COUNT(*) FROM races WHERE championship_id = c.id)::int as race_count,
    (SELECT COUNT(*) FROM races WHERE championship_id = c.id AND status = 'completed')::int as completed_races
    FROM championships c JOIN users u ON c.created_by = u.id`;
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (search) { conditions.push(`c.name LIKE $${idx++}`); params.push(`%${search}%`); }
  if (status) { conditions.push(`c.status = $${idx++}`); params.push(status); }

  if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY c.created_at DESC';

  const countResult = await db.query(`SELECT COUNT(*)::int as total FROM championships c${conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : ''}`, params) as any[];
  const total = countResult[0]?.total || 0;

  query += ` LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);
  const championships = await db.query(query, params);

  res.json({ championships, total, page, limit });
}));

router.get('/:id', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const champ = await db.queryOne(`
    SELECT c.*, u.username as organizer_name,
      (SELECT COUNT(*) FROM drivers WHERE championship_id = c.id)::int as driver_count,
      (SELECT COUNT(*) FROM races WHERE championship_id = c.id)::int as race_count,
      (SELECT COUNT(*) FROM races WHERE championship_id = c.id AND status = 'completed')::int as completed_races
    FROM championships c JOIN users u ON c.created_by = u.id WHERE c.id = $1
  `, [req.params.id]) as any;
  if (!champ) { res.status(404).json({ error: 'Championship not found' }); return; }

  const scoring = await db.queryOne('SELECT * FROM scoring_systems WHERE championship_id = $1', [champ.id]);
  const nextRace = await db.query("SELECT * FROM races WHERE championship_id = $1 AND status != 'completed' AND date >= date('now') ORDER BY date ASC LIMIT 1", [champ.id]);
  const lastResults = await db.query(`
    SELECT rr.id, rr.race_id, rr.driver_id, rr.position, rr.points, rr.qualifying_position, rr.pole_position, rr.fastest_lap, rr.dnf,
      d.name as driver_name, r.name as race_name, r.circuit, r.date as race_date
    FROM race_results rr JOIN races r ON rr.race_id = r.id JOIN drivers d ON rr.driver_id = d.id
    WHERE r.championship_id = $1 ORDER BY r.date DESC LIMIT 10
  `, [champ.id]);

  res.json({ ...champ, scoring, next_race: nextRace[0] || null, last_results: lastResults });
}));

router.post('/', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, season, description, rules, max_participants, cover_image } = req.body;
  if (!name || !season) { res.status(400).json({ error: 'Name and season are required' }); return; }
  const id = uuidv4();
  await db.execute(`
    INSERT INTO championships (id, name, season, description, rules, max_participants, cover_image, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [id, name, season, description || '', rules || '', max_participants || 30, cover_image || '', req.user!.id]);
  await db.execute('INSERT INTO scoring_systems (id, championship_id) VALUES ($1, $2)', [uuidv4(), id]);
  res.status(201).json(await db.queryOne('SELECT * FROM championships WHERE id = $1', [id]));
}));

router.put('/:id', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  const champ = await db.queryOne('SELECT * FROM championships WHERE id = $1 AND created_by = $2', [req.params.id, req.user!.id]) as any;
  if (!champ) { res.status(403).json({ error: 'Not authorized or not found' }); return; }
  const { name, season, description, rules, max_participants, cover_image } = req.body;
  await db.execute(`
    UPDATE championships SET name = COALESCE($1, name), season = COALESCE($2, season),
    description = COALESCE($3, description), rules = COALESCE($4, rules),
    max_participants = COALESCE($5, max_participants), cover_image = COALESCE($6, cover_image),
    updated_at = NOW() WHERE id = $7
  `, [name, season, description, rules, max_participants, cover_image, req.params.id]);
  res.json(await db.queryOne('SELECT * FROM championships WHERE id = $1', [req.params.id]));
}));

router.delete('/:id', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  const champ = await db.queryOne('SELECT * FROM championships WHERE id = $1 AND created_by = $2', [req.params.id, req.user!.id]);
  if (!champ) { res.status(403).json({ error: 'Not authorized or not found' }); return; }
  await db.execute('DELETE FROM championships WHERE id = $1', [req.params.id]);
  res.json({ message: 'Championship deleted' });
}));

router.put('/:id/conclude', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  const champ = await db.queryOne('SELECT * FROM championships WHERE id = $1 AND created_by = $2', [req.params.id, req.user!.id]) as any;
  if (!champ) { res.status(403).json({ error: 'Not authorized or not found' }); return; }
  const newStatus = champ.status === 'concluded' ? 'active' : 'concluded';
  await db.execute("UPDATE championships SET status = $1, updated_at = NOW() WHERE id = $2", [newStatus, req.params.id]);
  res.json(await db.queryOne('SELECT * FROM championships WHERE id = $1', [req.params.id]));
}));

router.get('/:id/standings', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const driverStandings = await db.query(`
    SELECT ds.*, d.name as driver_name, d.number as driver_number, d.avatar, d.team_id,
      t.name as team_name, t.color as team_color
    FROM driver_standings ds JOIN drivers d ON ds.driver_id = d.id
    LEFT JOIN teams t ON d.team_id = t.id
    WHERE ds.championship_id = $1 ORDER BY ds.position ASC
  `, [req.params.id]);

  const constructorStandings = await db.query(`
    SELECT cs.*, t.name as team_name, t.color as team_color,
      (SELECT COUNT(*) FROM drivers WHERE team_id = t.id)::int as driver_count
    FROM constructor_standings cs JOIN teams t ON cs.team_id = t.id
    WHERE cs.championship_id = $1 ORDER BY cs.position ASC
  `, [req.params.id]);

  res.json({ driver_standings: driverStandings, constructor_standings: constructorStandings });
}));

router.put('/:id/scoring', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  const champ = await db.queryOne('SELECT id FROM championships WHERE id = $1 AND created_by = $2', [req.params.id, req.user!.id]);
  if (!champ) { res.status(403).json({ error: 'Not authorized' }); return; }
  const { position_points, pole_bonus, fastest_lap_bonus } = req.body;
  await db.execute(`
    UPDATE scoring_systems SET position_points = COALESCE($1, position_points),
    pole_bonus = COALESCE($2, pole_bonus), fastest_lap_bonus = COALESCE($3, fastest_lap_bonus),
    updated_at = NOW() WHERE championship_id = $4
  `, [position_points ? JSON.stringify(position_points) : null, pole_bonus, fastest_lap_bonus, req.params.id]);
  res.json(await db.queryOne('SELECT * FROM scoring_systems WHERE championship_id = $1', [req.params.id]));
}));

router.get('/:id/statistics', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const drivers = await db.query(`
    SELECT d.id, d.name, d.number, d.avatar, t.name as team_name, t.color as team_color,
      ds.points, ds.wins, ds.podiums, ds.poles, ds.fastest_laps, ds.races_done,
      CASE WHEN ds.races_done > 0 THEN ROUND(ds.points * 1.0 / ds.races_done, 1) ELSE 0 END as avg_points,
      CASE WHEN ds.races_done > 0 THEN ROUND(ds.podiums * 100.0 / ds.races_done, 1) ELSE 0 END as podium_pct,
      ds.position
    FROM drivers d JOIN driver_standings ds ON d.id = ds.driver_id AND ds.championship_id = $1
    LEFT JOIN teams t ON d.team_id = t.id
    WHERE d.championship_id = $1 ORDER BY ds.position ASC
  `, [req.params.id]);

  const races = await db.query(`
    SELECT r.*, rr.driver_id, rr.position, rr.points, rr.pole_position, rr.fastest_lap, rr.dnf
    FROM races r LEFT JOIN race_results rr ON r.id = rr.race_id
    WHERE r.championship_id = $1 AND r.status = 'completed' ORDER BY r.date ASC
  `, [req.params.id]);

  const raceMap: Record<string, any> = {};
  for (const r of races) {
    if (!raceMap[r.id]) raceMap[r.id] = { id: r.id, name: r.name, circuit: r.circuit, date: r.date, results: [] };
    if (r.driver_id) raceMap[r.id].results.push({ driver_id: r.driver_id, position: r.position, points: r.points, pole: r.pole_position, fl: r.fastest_lap, dnf: r.dnf });
  }

  res.json({ drivers, race_history: Object.values(raceMap) });
}));

router.get('/:id/title-scenarios', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const champ = await db.queryOne('SELECT * FROM championships WHERE id = $1', [req.params.id]) as any;
  if (!champ) { res.status(404).json({ error: 'Championship not found' }); return; }
  if (champ.status === 'concluded') { res.json({ scenarios: [], concluded: true }); return; }

  const sc = await db.queryOne('SELECT * FROM scoring_systems WHERE championship_id = $1', [champ.id]) as any;
  if (!sc) { res.json({ scenarios: [], concluded: false }); return; }

  const pointsArray = JSON.parse(sc.position_points);
  const maxPerRace = (pointsArray[0] || 25) + (sc.pole_bonus || 0) + (sc.fastest_lap_bonus || 0);

  const races = await db.query("SELECT * FROM races WHERE championship_id = $1 ORDER BY date ASC", [champ.id]) as any[];
  const nextRace = races.find((r: any) => r.status !== 'completed');
  const remaining = races.filter((r: any) => r.status !== 'completed');
  const afterNext = remaining.length - 1;

  if (!nextRace) { res.json({ scenarios: [], concluded: false, no_next_race: true }); return; }

  const driverStandings = await db.query(`
    SELECT ds.*, d.name as driver_name, d.number as driver_number, d.avatar, d.team_id,
      t.name as team_name, t.color as team_color
    FROM driver_standings ds JOIN drivers d ON ds.driver_id = d.id
    LEFT JOIN teams t ON d.team_id = t.id
    WHERE ds.championship_id = $1 ORDER BY ds.points DESC
  `, [champ.id]) as any[];

  if (driverStandings.length === 0) { res.json({ scenarios: [], concluded: false }); return; }

  const leader = driverStandings[0];
  const scenarios: any[] = [];

  for (const d of driverStandings) {
    const maxPerNext = pointsArray[0] + (sc.pole_bonus || 0) + (sc.fastest_lap_bonus || 0);
    const driverMaxTotal = d.points + maxPerNext + (afterNext * maxPerRace);
    if (driverMaxTotal <= leader.points) continue;

    const ptsNeeded = leader.points - d.points + 1;
    let posNeeded = pointsArray.length;
    for (let p = 1; p <= pointsArray.length; p++) {
      if (pointsArray[p - 1] >= ptsNeeded) { posNeeded = p; break; }
    }

    let canClinch = false;
    let desc = '';
    let leaderLimit = -1;

    if (afterNext === 0) {
      let guaranteed = true;
      for (const rival of driverStandings) {
        if (rival.driver_id === d.driver_id) continue;
        if (d.points + pointsArray[posNeeded - 1] <= rival.points + maxPerRace) { guaranteed = false; break; }
      }
      canClinch = true;
      desc = guaranteed
        ? `${d.driver_name} vince il campionato se arriva ${posNeeded}° (o meglio)!`
        : `${d.driver_name} vince se arriva ${posNeeded}° e gli inseguitori non prendono punti.`;
    } else {
      const dNew = d.points + pointsArray[posNeeded - 1];
      for (let lp = 1; lp <= pointsArray.length; lp++) {
        if (dNew > leader.points + pointsArray[lp - 1] + (afterNext * maxPerRace)) { leaderLimit = lp; break; }
      }
      if (leaderLimit === -1) {
        if (dNew > leader.points + (afterNext * maxPerRace)) {
          desc = `Se ${d.driver_name} arriva ${posNeeded}° e ${leader.driver_name} non segna punti, vince il campionato.`;
        } else {
          desc = `${d.driver_name} è ancora in corsa ma non può vincere matematicamente alla prossima gara.`;
          scenarios.push({ driver_id: d.id, driver_name: d.driver_name, driver_number: d.driver_number, avatar: d.avatar, team_name: d.team_name, team_color: d.team_color, current_points: d.points, can_win_next_race: false, position_needed: posNeeded, leader_driver_name: leader.driver_name, leader_driver_id: leader.driver_id, leader_points: leader.points, leader_position_limit: -1, scenario_description: desc });
          continue;
        }
      } else {
        desc = `Se ${d.driver_name} arriva ${posNeeded}° (o meglio) E ${leader.driver_name} arriva ${leaderLimit}° (o peggio), ${d.driver_name} vince il campionato!`;
        canClinch = true;
      }
    }

    scenarios.push({ driver_id: d.id, driver_name: d.driver_name, driver_number: d.driver_number, avatar: d.avatar, team_name: d.team_name, team_color: d.team_color, current_points: d.points, can_win_next_race: canClinch, position_needed: posNeeded, leader_driver_name: leader.driver_name, leader_driver_id: leader.driver_id, leader_points: leader.points, leader_position_limit: leaderLimit, scenario_description: desc });
  }

  scenarios.sort((a, b) => (b.can_win_next_race ? 1 : 0) - (a.can_win_next_race ? 1 : 0));
  res.json({ scenarios, concluded: false, next_race: nextRace, remaining_races: remaining.length, max_points_per_race: maxPerRace });
}));

export default router;
