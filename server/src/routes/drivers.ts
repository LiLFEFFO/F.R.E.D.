import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/schema';
import { authenticate, requireElite, optionalAuth, AuthRequest, canManageChampionship } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const championship_id = req.query.championship_id as string;
  const search = req.query.search as string || '';
  let query = `
    SELECT d.*, t.name as team_name, t.color as team_color,
      ds.points, ds.position, ds.wins, ds.podiums, ds.poles, ds.fastest_laps, ds.races_done
    FROM drivers d
    LEFT JOIN teams t ON d.team_id = t.id
    LEFT JOIN driver_standings ds ON d.id = ds.driver_id
    WHERE 1=1
  `;
  const params: any[] = [];
  let idx = 1;
  if (championship_id) {
    query += ` AND d.championship_id = $${idx++}`;
    params.push(championship_id);
  }
  if (search) {
    query += ` AND d.name LIKE $${idx++}`;
    params.push(`%${search}%`);
  }
  query += ' ORDER BY d.name ASC';
  res.json(await db.query(query, params));
}));

router.get('/:id', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const driver = await db.queryOne(`
    SELECT d.*, t.name as team_name, t.color as team_color,
      ds.points, ds.position, ds.wins, ds.podiums, ds.poles, ds.fastest_laps, ds.races_done,
      ds.previous_position, c.name as championship_name, c.season
    FROM drivers d
    LEFT JOIN teams t ON d.team_id = t.id
    LEFT JOIN driver_standings ds ON d.id = ds.driver_id
    LEFT JOIN championships c ON d.championship_id = c.id
    WHERE d.id = $1
  `, [req.params.id]) as any;
  if (!driver) { res.status(404).json({ error: 'Driver not found' }); return; }

  const results = await db.query(`
    SELECT rr.*, r.name as race_name, r.circuit, r.date, r.weather
    FROM race_results rr JOIN races r ON rr.race_id = r.id
    WHERE rr.driver_id = $1 AND r.championship_id = $2 ORDER BY r.date ASC
  `, [driver.id, driver.championship_id]);

  const allChampionships = await db.query(`
    SELECT DISTINCT c.id, c.name, c.season FROM championships c
    JOIN drivers d ON d.championship_id = c.id WHERE d.user_id = $1
    UNION
    SELECT DISTINCT c.id, c.name, c.season FROM championships c
    JOIN drivers d ON d.championship_id = c.id WHERE d.id = $2
  `, [driver.user_id, driver.id]);

  const userDriver = driver.user_id
    ? await db.queryOne('SELECT id, username, email, avatar FROM users WHERE id = $1', [driver.user_id])
    : null;

  res.json({ ...driver, results, user: userDriver, championships: allChampionships });
}));

router.post('/', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { championship_id, name, number, team_id, user_id, avatar } = req.body;
  if (!championship_id || !name || !number) { res.status(400).json({ error: 'Championship, name and number are required' }); return; }
  if (!await canManageChampionship(championship_id, req.user!.id)) {
    res.status(403).json({ error: 'Not authorized' }); return;
  }
  const id = uuidv4();
  await db.execute('INSERT INTO drivers (id, championship_id, name, number, team_id, user_id, avatar) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [id, championship_id, name, number, team_id || null, user_id || null, avatar || '']);
  res.status(201).json(await db.queryOne('SELECT * FROM drivers WHERE id = $1', [id]));
}));

router.put('/:id', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  const driver = await db.queryOne('SELECT d.*, d.championship_id FROM drivers d WHERE d.id = $1', [req.params.id]) as any;
  if (!driver) { res.status(404).json({ error: 'Driver not found' }); return; }
  if (!await canManageChampionship(driver.championship_id, req.user!.id)) {
    res.status(403).json({ error: 'Not authorized' }); return;
  }
  const { name, number, team_id, user_id, avatar } = req.body;
  await db.execute(`
    UPDATE drivers SET name = COALESCE($1, name), number = COALESCE($2, number),
    team_id = $3, user_id = $4, avatar = COALESCE($5, avatar) WHERE id = $6
  `, [name, number, team_id !== undefined ? team_id : driver.team_id, user_id !== undefined ? user_id : driver.user_id, avatar, req.params.id]);
  res.json(await db.queryOne('SELECT * FROM drivers WHERE id = $1', [req.params.id]));
}));

router.delete('/:id', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  const driver = await db.queryOne('SELECT d.id, d.championship_id FROM drivers d WHERE d.id = $1', [req.params.id]) as any;
  if (!driver) { res.status(404).json({ error: 'Driver not found' }); return; }
  if (!await canManageChampionship(driver.championship_id, req.user!.id)) {
    res.status(403).json({ error: 'Not authorized' }); return;
  }
  await db.execute('DELETE FROM drivers WHERE id = $1', [req.params.id]);
  res.json({ message: 'Driver deleted' });
}));

export default router;
