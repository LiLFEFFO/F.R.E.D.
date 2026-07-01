import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from '../database/schema';
import { authenticate, requireElite, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, (req: AuthRequest, res: Response): void => {
  const db = getDb();
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

  if (championship_id) {
    query += ' AND d.championship_id = ?';
    params.push(championship_id);
  }
  if (search) {
    query += ' AND d.name LIKE ?';
    params.push(`%${search}%`);
  }
  query += ' ORDER BY d.name ASC';

  const drivers = db.prepare(query).all(...params);
  res.json(drivers);
});

router.get('/:id', optionalAuth, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const driver = db.prepare(`
    SELECT d.*, t.name as team_name, t.color as team_color,
      ds.points, ds.position, ds.wins, ds.podiums, ds.poles, ds.fastest_laps, ds.races_done,
      ds.previous_position, c.name as championship_name, c.season
    FROM drivers d
    LEFT JOIN teams t ON d.team_id = t.id
    LEFT JOIN driver_standings ds ON d.id = ds.driver_id
    LEFT JOIN championships c ON d.championship_id = c.id
    WHERE d.id = ?
  `).get(req.params.id) as any;

  if (!driver) {
    res.status(404).json({ error: 'Driver not found' });
    return;
  }

  const results = db.prepare(`
    SELECT rr.*, r.name as race_name, r.circuit, r.date, r.weather
    FROM race_results rr
    JOIN races r ON rr.race_id = r.id
    WHERE rr.driver_id = ? AND r.championship_id = ?
    ORDER BY r.date ASC
  `).all(driver.id, driver.championship_id);

  const allChampionships = db.prepare(`
    SELECT DISTINCT c.id, c.name, c.season FROM championships c
    JOIN drivers d ON d.championship_id = c.id WHERE d.user_id = ?
    UNION
    SELECT DISTINCT c.id, c.name, c.season FROM championships c
    JOIN drivers d ON d.championship_id = c.id WHERE d.id = ?
  `).all(driver.user_id, driver.id);

  const userDriver = driver.user_id ? db.prepare('SELECT id, username, email, avatar FROM users WHERE id = ?').get(driver.user_id) : null;

  res.json({ ...driver, results, user: userDriver, championships: allChampionships });
});

router.post('/', authenticate, requireElite, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const { championship_id, name, number, team_id, user_id, avatar } = req.body;
  if (!championship_id || !name || !number) {
    res.status(400).json({ error: 'Championship, name and number are required' });
    return;
  }
  const champ = db.prepare('SELECT id FROM championships WHERE id = ? AND created_by = ?').get(championship_id, req.user!.id);
  if (!champ) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }
  const id = uuidv4();
  db.prepare('INSERT INTO drivers (id, championship_id, name, number, team_id, user_id, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, championship_id, name, number, team_id || null, user_id || null, avatar || '');
  saveDb();
  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(id);
  res.status(201).json(driver);
});

router.put('/:id', authenticate, requireElite, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const driver = db.prepare(`
    SELECT d.* FROM drivers d
    JOIN championships c ON d.championship_id = c.id
    WHERE d.id = ? AND c.created_by = ?
  `).get(req.params.id, req.user!.id) as any;
  if (!driver) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }
  const { name, number, team_id, user_id, avatar } = req.body;
  db.prepare(`
    UPDATE drivers SET name = COALESCE(?, name), number = COALESCE(?, number),
    team_id = ?, user_id = ?, avatar = COALESCE(?, avatar) WHERE id = ?
  `).run(name, number, team_id !== undefined ? team_id : driver.team_id, user_id !== undefined ? user_id : driver.user_id, avatar, req.params.id);
  saveDb();

  const updated = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', authenticate, requireElite, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const driver = db.prepare(`
    SELECT d.id FROM drivers d
    JOIN championships c ON d.championship_id = c.id
    WHERE d.id = ? AND c.created_by = ?
  `).get(req.params.id, req.user!.id);
  if (!driver) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }
  db.prepare('DELETE FROM drivers WHERE id = ?').run(req.params.id);
  saveDb();
  res.json({ message: 'Driver deleted' });
});

export default router;
