import { Router, Response } from 'express';
import { getDb, saveDb } from '../database/schema';
import { authenticate, requireElite, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/my-championships', authenticate, requireElite, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const championships = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM drivers WHERE championship_id = c.id) as driver_count,
      (SELECT COUNT(*) FROM teams WHERE championship_id = c.id) as team_count,
      (SELECT COUNT(*) FROM races WHERE championship_id = c.id) as race_count,
      (SELECT COUNT(*) FROM races WHERE championship_id = c.id AND status = 'completed') as completed_races
    FROM championships c WHERE c.created_by = ?
    ORDER BY c.updated_at DESC
  `).all(req.user!.id);
  res.json(championships);
});

router.get('/dashboard', authenticate, requireElite, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const championships = db.prepare(`
    SELECT c.id, c.name, c.season, c.status,
      (SELECT COUNT(*) FROM drivers WHERE championship_id = c.id) as drivers,
      (SELECT COUNT(*) FROM races WHERE championship_id = c.id) as races,
      (SELECT COUNT(*) FROM races WHERE championship_id = c.id AND status = 'completed') as completed
    FROM championships c WHERE c.created_by = ?
    ORDER BY c.updated_at DESC
  `).all(req.user!.id);

  const totalDrivers = championships.reduce((sum: number, c: any) => sum + c.drivers, 0);
  const totalRaces = championships.reduce((sum: number, c: any) => sum + c.races, 0);
  const totalCompleted = championships.reduce((sum: number, c: any) => sum + c.completed, 0);

  const recentResults = db.prepare(`
    SELECT rr.*, r.name as race_name, r.date, c.name as championship_name, d.name as driver_name
    FROM race_results rr
    JOIN races r ON rr.race_id = r.id
    JOIN championships c ON r.championship_id = c.id
    JOIN drivers d ON rr.driver_id = d.id
    WHERE c.created_by = ?
    ORDER BY rr.created_at DESC LIMIT 20
  `).all(req.user!.id);

  res.json({
    championships_count: championships.length,
    total_drivers: totalDrivers,
    total_races: totalRaces,
    total_completed: totalCompleted,
    championships,
    recent_results: recentResults,
  });
});

router.get('/users', authenticate, requireElite, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const search = req.query.search as string || '';
  let query = 'SELECT id, username, email, role, avatar, discord_id, created_at FROM users';
  const params: any[] = [];
  if (search) {
    query += ' WHERE username LIKE ? OR email LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }
  query += ' ORDER BY created_at DESC LIMIT 50';
  res.json(db.prepare(query).all(...params));
});

router.put('/users/:id/role', authenticate, requireElite, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const { role } = req.body;
  if (!['standard', 'elite'].includes(role)) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }
  db.prepare('UPDATE users SET role = ?, updated_at = datetime("now") WHERE id = ?').run(role, req.params.id);
  saveDb();
  const user = db.prepare('SELECT id, username, email, role FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});

export default router;
