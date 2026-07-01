import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from '../database/schema';
import { authenticate, requireElite, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string || '';
  const status = req.query.status as string || '';
  const offset = (page - 1) * limit;

  let query = `SELECT c.*, u.username as organizer_name,
    (SELECT COUNT(*) FROM drivers WHERE championship_id = c.id) as driver_count,
    (SELECT COUNT(*) FROM races WHERE championship_id = c.id) as race_count,
    (SELECT COUNT(*) FROM races WHERE championship_id = c.id AND status = 'completed') as completed_races
    FROM championships c JOIN users u ON c.created_by = u.id`;
  let countQuery = 'SELECT COUNT(*) as total FROM championships c';
  const conditions: string[] = [];
  const params: any[] = [];
  const countParams: any[] = [];

  if (search) {
    conditions.push('c.name LIKE ?');
    params.push(`%${search}%`);
    countParams.push(`%${search}%`);
  }
  if (status) {
    conditions.push('c.status = ?');
    params.push(status);
    countParams.push(status);
  }

  if (conditions.length > 0) {
    const where = ' WHERE ' + conditions.join(' AND ');
    query += where;
    countQuery += where;
  }

  query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const championships = db.prepare(query).all(...params);
  const total = (db.prepare(countQuery).get(...countParams) as any)?.total || 0;

  res.json({ championships, total, page, limit });
});

router.get('/:id', optionalAuth, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const champ = db.prepare(`
    SELECT c.*, u.username as organizer_name,
      (SELECT COUNT(*) FROM drivers WHERE championship_id = c.id) as driver_count,
      (SELECT COUNT(*) FROM races WHERE championship_id = c.id) as race_count,
      (SELECT COUNT(*) FROM races WHERE championship_id = c.id AND status = 'completed') as completed_races
    FROM championships c JOIN users u ON c.created_by = u.id WHERE c.id = ?
  `).get(req.params.id) as any;
  if (!champ) {
    res.status(404).json({ error: 'Championship not found' });
    return;
  }
  const scoring = db.prepare('SELECT * FROM scoring_systems WHERE championship_id = ?').get(champ.id);
  const nextRace = db.prepare("SELECT * FROM races WHERE championship_id = ? AND status != 'completed' AND date >= date('now') ORDER BY date ASC LIMIT 1").all(champ.id);
  const lastResults = db.prepare(`
    SELECT rr.id, rr.race_id, rr.driver_id, rr.position, rr.points, rr.qualifying_position, rr.pole_position, rr.fastest_lap, rr.dnf, rr.penalties,
      d.name as driver_name, r.name as race_name, r.circuit, r.date as race_date
    FROM race_results rr
    JOIN races r ON rr.race_id = r.id
    JOIN drivers d ON rr.driver_id = d.id
    WHERE r.championship_id = ?
    ORDER BY r.date DESC LIMIT 10
  `).all(champ.id);

  res.json({ ...champ, scoring, next_race: nextRace[0] || null, last_results: lastResults });
});

router.post('/', authenticate, requireElite, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const { name, season, description, rules, max_participants, cover_image } = req.body;
  if (!name || !season) {
    res.status(400).json({ error: 'Name and season are required' });
    return;
  }
  const id = uuidv4();
  db.prepare(`
    INSERT INTO championships (id, name, season, description, rules, max_participants, cover_image, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, season, description || '', rules || '', max_participants || 30, cover_image || '', req.user!.id);

  db.prepare('INSERT INTO scoring_systems (id, championship_id) VALUES (?, ?)').run(uuidv4(), id);
  saveDb();

  const champ = db.prepare('SELECT * FROM championships WHERE id = ?').get(id);
  res.status(201).json(champ);
});

router.put('/:id', authenticate, requireElite, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const champ = db.prepare('SELECT * FROM championships WHERE id = ? AND created_by = ?').get(req.params.id, req.user!.id) as any;
  if (!champ) {
    res.status(403).json({ error: 'Not authorized or not found' });
    return;
  }
  const { name, season, description, rules, max_participants, cover_image } = req.body;
  db.prepare(`
    UPDATE championships SET name = COALESCE(?, name), season = COALESCE(?, season),
    description = COALESCE(?, description), rules = COALESCE(?, rules),
    max_participants = COALESCE(?, max_participants), cover_image = COALESCE(?, cover_image),
    updated_at = datetime('now') WHERE id = ?
  `).run(name, season, description, rules, max_participants, cover_image, req.params.id);
  saveDb();

  const updated = db.prepare('SELECT * FROM championships WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', authenticate, requireElite, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const champ = db.prepare('SELECT * FROM championships WHERE id = ? AND created_by = ?').get(req.params.id, req.user!.id);
  if (!champ) {
    res.status(403).json({ error: 'Not authorized or not found' });
    return;
  }
  db.prepare('DELETE FROM championships WHERE id = ?').run(req.params.id);
  saveDb();
  res.json({ message: 'Championship deleted' });
});

router.put('/:id/conclude', authenticate, requireElite, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const champ = db.prepare('SELECT * FROM championships WHERE id = ? AND created_by = ?').get(req.params.id, req.user!.id) as any;
  if (!champ) {
    res.status(403).json({ error: 'Not authorized or not found' });
    return;
  }
  const newStatus = champ.status === 'concluded' ? 'active' : 'concluded';
  db.prepare("UPDATE championships SET status = ?, updated_at = datetime('now') WHERE id = ?").run(newStatus, req.params.id);
  saveDb();
  const updated = db.prepare('SELECT * FROM championships WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.get('/:id/standings', optionalAuth, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const driverStandings = db.prepare(`
    SELECT ds.*, d.name as driver_name, d.number as driver_number, d.avatar, d.team_id,
      t.name as team_name, t.color as team_color
    FROM driver_standings ds
    JOIN drivers d ON ds.driver_id = d.id
    LEFT JOIN teams t ON d.team_id = t.id
    WHERE ds.championship_id = ?
    ORDER BY ds.position ASC
  `).all(req.params.id);

  const constructorStandings = db.prepare(`
    SELECT cs.*, t.name as team_name, t.color as team_color,
      (SELECT COUNT(*) FROM drivers WHERE team_id = t.id) as driver_count
    FROM constructor_standings cs
    JOIN teams t ON cs.team_id = t.id
    WHERE cs.championship_id = ?
    ORDER BY cs.position ASC
  `).all(req.params.id);

  res.json({ driver_standings: driverStandings, constructor_standings: constructorStandings });
});

router.put('/:id/scoring', authenticate, requireElite, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const champ = db.prepare('SELECT id FROM championships WHERE id = ? AND created_by = ?').get(req.params.id, req.user!.id);
  if (!champ) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }
  const { position_points, pole_bonus, fastest_lap_bonus } = req.body;
  db.prepare(`
    UPDATE scoring_systems SET position_points = COALESCE(?, position_points),
    pole_bonus = COALESCE(?, pole_bonus), fastest_lap_bonus = COALESCE(?, fastest_lap_bonus),
    updated_at = datetime('now') WHERE championship_id = ?
  `  ).run(
    position_points ? JSON.stringify(position_points) : null,
    pole_bonus, fastest_lap_bonus, req.params.id
  );
  saveDb();
  const updated = db.prepare('SELECT * FROM scoring_systems WHERE championship_id = ?').get(req.params.id);
  res.json(updated);
});

router.get('/:id/statistics', optionalAuth, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const drivers = db.prepare(`
    SELECT d.id, d.name, d.number, d.avatar, t.name as team_name, t.color as team_color,
      ds.points, ds.wins, ds.podiums, ds.poles, ds.fastest_laps, ds.races_done,
      CASE WHEN ds.races_done > 0 THEN ROUND(ds.points * 1.0 / ds.races_done, 1) ELSE 0 END as avg_points,
      CASE WHEN ds.races_done > 0 THEN ROUND(ds.podiums * 100.0 / ds.races_done, 1) ELSE 0 END as podium_pct,
      ds.position
    FROM drivers d
    JOIN driver_standings ds ON d.id = ds.driver_id AND ds.championship_id = ?
    LEFT JOIN teams t ON d.team_id = t.id
    WHERE d.championship_id = ?
    ORDER BY ds.position ASC
  `).all(req.params.id, req.params.id);

  const races = db.prepare(`
    SELECT r.*, rr.driver_id, rr.position, rr.points, rr.pole_position, rr.fastest_lap, rr.dnf
    FROM races r
    LEFT JOIN race_results rr ON r.id = rr.race_id
    WHERE r.championship_id = ? AND r.status = 'completed'
    ORDER BY r.date ASC
  `).all(req.params.id);

  const raceMap: Record<string, any> = {};
  for (const r of races) {
    if (!raceMap[r.id]) {
      raceMap[r.id] = { id: r.id, name: r.name, circuit: r.circuit, date: r.date, results: [] };
    }
    if (r.driver_id) {
      raceMap[r.id].results.push({ driver_id: r.driver_id, position: r.position, points: r.points, pole: r.pole_position, fl: r.fastest_lap, dnf: r.dnf });
    }
  }

  res.json({ drivers, race_history: Object.values(raceMap) });
});

export default router;
