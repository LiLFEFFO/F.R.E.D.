import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/schema';
import { authenticate, requireElite, optionalAuth, AuthRequest, canManageChampionship } from '../middleware/auth';
import { recalculateChampionship } from '../services/scoring';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const championship_id = req.query.championship_id as string;
  let query = 'SELECT * FROM races';
  const params: any[] = [];
  if (championship_id) { query += ' WHERE championship_id = $1'; params.push(championship_id); }
  query += ' ORDER BY date ASC';
  res.json(await db.query(query, params));
}));

router.get('/:id', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const race = await db.queryOne('SELECT * FROM races WHERE id = $1', [req.params.id]) as any;
  if (!race) { res.status(404).json({ error: 'Race not found' }); return; }

  const results = await db.query(`
    SELECT rr.*, d.name as driver_name, d.number as driver_number, d.avatar, d.team_id,
      t.name as team_name, t.color as team_color
    FROM race_results rr JOIN drivers d ON rr.driver_id = d.id
    LEFT JOIN teams t ON d.team_id = t.id
    WHERE rr.race_id = $1 ORDER BY rr.position ASC
  `, [race.id]);

  let sprint_results: any[] = [];
  if (race.has_sprint) {
    sprint_results = await db.query(`
      SELECT sr.*, d.name as driver_name, d.number as driver_number, d.avatar, d.team_id,
        t.name as team_name, t.color as team_color
      FROM sprint_results sr JOIN drivers d ON sr.driver_id = d.id
      LEFT JOIN teams t ON d.team_id = t.id
      WHERE sr.race_id = $1 ORDER BY sr.position ASC
    `, [race.id]);
  }

  const sc = await db.queryOne('SELECT * FROM scoring_systems WHERE championship_id = $1', [race.championship_id]);
  res.json({ ...race, results, sprint_results, scoring: sc });
}));

router.post('/', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { championship_id, name, circuit, date, weather, has_sprint } = req.body;
  if (!championship_id || !name || !circuit || !date) { res.status(400).json({ error: 'Missing required fields' }); return; }
  if (!await canManageChampionship(championship_id, req.user!.id)) {
    res.status(403).json({ error: 'Not authorized' }); return;
  }
  const id = uuidv4();
  await db.execute('INSERT INTO races (id, championship_id, name, circuit, date, weather, has_sprint) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [id, championship_id, name, circuit, date, weather || 'Dry', has_sprint ? 1 : 0]);
  res.status(201).json(await db.queryOne('SELECT * FROM races WHERE id = $1', [id]));
}));

router.put('/:id', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  const race = await db.queryOne('SELECT r.* FROM races r WHERE r.id = $1', [req.params.id]) as any;
  if (!race) { res.status(404).json({ error: 'Race not found' }); return; }
  if (!await canManageChampionship(race.championship_id, req.user!.id)) {
    res.status(403).json({ error: 'Not authorized' }); return;
  }
  const { name, circuit, date, weather, status, has_sprint } = req.body;
  await db.execute(`UPDATE races SET name = COALESCE($1, name), circuit = COALESCE($2, circuit), date = COALESCE($3, date), weather = COALESCE($4, weather), status = COALESCE($5, status), has_sprint = COALESCE($6, has_sprint), updated_at = NOW() WHERE id = $7`,
    [name, circuit, date, weather, status, has_sprint != null ? (has_sprint ? 1 : 0) : undefined, req.params.id]);
  res.json(await db.queryOne('SELECT * FROM races WHERE id = $1', [req.params.id]));
}));

router.delete('/:id', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  const race = await db.queryOne('SELECT r.id, r.championship_id FROM races r WHERE r.id = $1', [req.params.id]) as any;
  if (!race) { res.status(404).json({ error: 'Race not found' }); return; }
  if (!await canManageChampionship(race.championship_id, req.user!.id)) {
    res.status(403).json({ error: 'Not authorized' }); return;
  }
  await db.execute('DELETE FROM races WHERE id = $1', [req.params.id]);
  await db.execute('DELETE FROM race_results WHERE race_id = $1', [req.params.id]);
  await recalculateChampionship(race.championship_id);
  res.json({ message: 'Race deleted' });
}));

router.post('/:id/results', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  const race = await db.queryOne('SELECT r.* FROM races r WHERE r.id = $1', [req.params.id]) as any;
  if (!race) { res.status(404).json({ error: 'Race not found' }); return; }
  if (!await canManageChampionship(race.championship_id, req.user!.id)) {
    res.status(403).json({ error: 'Not authorized' }); return;
  }

  const sc = await db.queryOne('SELECT * FROM scoring_systems WHERE championship_id = $1', [race.championship_id]) as any;
  const pointsArray = sc ? JSON.parse(sc.position_points) : [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

  const { results } = req.body;
  if (!results || !Array.isArray(results)) { res.status(400).json({ error: 'Results array required' }); return; }

  await db.execute('DELETE FROM race_results WHERE race_id = $1', [race.id]);
  await db.execute("UPDATE races SET status = 'completed', updated_at = NOW() WHERE id = $1", [race.id]);

  for (const r of results) {
    const basePoints = (!r.dnf && r.present !== false && r.position <= pointsArray.length) ? pointsArray[r.position - 1] : 0;
    let totalPoints = basePoints;
    if (r.pole_position && sc && r.present !== false) totalPoints += sc.pole_bonus;
    if (r.fastest_lap && sc && r.present !== false) totalPoints += sc.fastest_lap_bonus;

    await db.execute(`
      INSERT INTO race_results (id, race_id, driver_id, position, points, pole_position, fastest_lap, dnf, present, qualifying_position, penalties, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [uuidv4(), race.id, r.driver_id, r.position, totalPoints,
        r.pole_position ? 1 : 0, r.fastest_lap ? 1 : 0, r.dnf ? 1 : 0,
        r.present !== false ? 1 : 0,
        r.qualifying_position != null ? r.qualifying_position : null,
        r.penalties || '', r.notes || ''
    ]);
  }

  await recalculateChampionship(race.championship_id);

  const updatedResults = await db.query(`
    SELECT rr.*, d.name as driver_name, d.number as driver_number
    FROM race_results rr JOIN drivers d ON rr.driver_id = d.id
    WHERE rr.race_id = $1 ORDER BY rr.position ASC
  `, [race.id]);

  const usersToNotify = await db.query('SELECT DISTINCT u.id FROM users u JOIN drivers d ON d.user_id = u.id WHERE d.championship_id = $1',
    [race.championship_id]) as any[];
  for (const u of usersToNotify) {
    await db.execute('INSERT INTO notifications (id, user_id, message, type) VALUES ($1, $2, $3, $4)',
      [uuidv4(), u.id, `New results published for ${race.name}`, 'result']);
  }

  res.json({ race_id: race.id, results: updatedResults });
}));

router.post('/:id/sprint-results', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  const race = await db.queryOne('SELECT r.* FROM races r WHERE r.id = $1', [req.params.id]) as any;
  if (!race) { res.status(404).json({ error: 'Race not found' }); return; }
  if (!await canManageChampionship(race.championship_id, req.user!.id)) {
    res.status(403).json({ error: 'Not authorized' }); return;
  }
  if (!race.has_sprint) { res.status(400).json({ error: 'This race does not have a sprint session' }); return; }

  const sc = await db.queryOne('SELECT * FROM scoring_systems WHERE championship_id = $1', [race.championship_id]) as any;
  const pointsArray = sc ? JSON.parse(sc.sprint_points) : [10, 8, 6, 5, 4, 3, 2, 1];

  const { results } = req.body;
  if (!results || !Array.isArray(results)) { res.status(400).json({ error: 'Results array required' }); return; }

  await db.execute('DELETE FROM sprint_results WHERE race_id = $1', [race.id]);

  for (const r of results) {
    const basePoints = (!r.dnf && r.present !== false && r.position <= pointsArray.length) ? pointsArray[r.position - 1] : 0;

    await db.execute(`
      INSERT INTO sprint_results (id, race_id, driver_id, position, points, dnf, present, penalties, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [uuidv4(), race.id, r.driver_id, r.position, basePoints,
        r.dnf ? 1 : 0, r.present !== false ? 1 : 0,
        r.penalties || '', r.notes || ''
    ]);
  }

  if (race.status !== 'completed') {
    await db.execute("UPDATE races SET status = 'in_progress', updated_at = NOW() WHERE id = $1", [race.id]);
  }

  await recalculateChampionship(race.championship_id);

  const updatedResults = await db.query(`
    SELECT sr.*, d.name as driver_name, d.number as driver_number
    FROM sprint_results sr JOIN drivers d ON sr.driver_id = d.id
    WHERE sr.race_id = $1 ORDER BY sr.position ASC
  `, [race.id]);

  res.json({ race_id: race.id, sprint_results: updatedResults });
}));

router.put('/:id/reopen', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  const race = await db.queryOne('SELECT r.* FROM races r WHERE r.id = $1', [req.params.id]) as any;
  if (!race) { res.status(404).json({ error: 'Race not found' }); return; }
  if (!await canManageChampionship(race.championship_id, req.user!.id)) {
    res.status(403).json({ error: 'Not authorized' }); return;
  }
  await db.execute("UPDATE races SET status = 'scheduled', updated_at = NOW() WHERE id = $1", [race.id]);
  await db.execute('DELETE FROM race_results WHERE race_id = $1', [race.id]);
  await db.execute('DELETE FROM sprint_results WHERE race_id = $1', [race.id]);
  res.json(await db.queryOne('SELECT * FROM races WHERE id = $1', [race.id]));
}));

router.get('/:id/export', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const race = await db.queryOne('SELECT * FROM races WHERE id = $1', [req.params.id]) as any;
  if (!race) { res.status(404).json({ error: 'Race not found' }); return; }

  const results = await db.query(`
    SELECT rr.position, d.name as driver, d.number, t.name as team, rr.points, rr.pole_position, rr.fastest_lap, rr.dnf, rr.penalties
    FROM race_results rr JOIN drivers d ON rr.driver_id = d.id
    LEFT JOIN teams t ON d.team_id = t.id
    WHERE rr.race_id = $1 ORDER BY rr.position ASC
  `, [race.id]);

  const format = req.query.format || 'json';
  if (format === 'csv') {
    let csv = 'Position,Driver,Number,Team,Points,Pole,Fastest Lap,DNF,Penalties\n';
    for (const r of results as any[]) {
      csv += `${r.position},"${r.driver}",${r.number},"${r.team}",${r.points},${r.pole_position ? 'Yes' : 'No'},${r.fastest_lap ? 'Yes' : 'No'},${r.dnf ? 'Yes' : 'No'},"${r.penalties}"\n`;
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${race.name}-results.csv"`);
    res.send(csv);
  } else {
    res.json({ race, results });
  }
}));

export default router;
