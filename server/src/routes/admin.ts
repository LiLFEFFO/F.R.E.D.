import { Router, Response } from 'express';
import { db } from '../database/schema';
import { authenticate, requireElite, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/my-championships', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  let championships = await db.query(`
    SELECT c.*,
      (SELECT COUNT(*) FROM drivers WHERE championship_id = c.id)::int as driver_count,
      (SELECT COUNT(*) FROM teams WHERE championship_id = c.id)::int as team_count,
      (SELECT COUNT(*) FROM races WHERE championship_id = c.id)::int as race_count,
      (SELECT COUNT(*) FROM races WHERE championship_id = c.id AND status = 'completed')::int as completed_races
    FROM championships c WHERE c.created_by = $1
    ORDER BY c.updated_at DESC
  `, [req.user!.id]);
  try {
    const collabChamps = await db.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM drivers WHERE championship_id = c.id)::int as driver_count,
        (SELECT COUNT(*) FROM teams WHERE championship_id = c.id)::int as team_count,
        (SELECT COUNT(*) FROM races WHERE championship_id = c.id)::int as race_count,
        (SELECT COUNT(*) FROM races WHERE championship_id = c.id AND status = 'completed')::int as completed_races
      FROM championships c JOIN championship_collaborators cc ON c.id = cc.championship_id
      WHERE cc.user_id = $1
      ORDER BY c.updated_at DESC
    `, [req.user!.id]);
    const ownIds = new Set(championships.map((c: any) => c.id));
    for (const c of collabChamps as any[]) {
      if (!ownIds.has(c.id)) championships.push(c);
    }
  } catch {}
  res.json(championships);
}));

router.get('/dashboard', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  let championships = await db.query(`
    SELECT c.id, c.name, c.season, c.status,
      (SELECT COUNT(*) FROM drivers WHERE championship_id = c.id)::int as drivers,
      (SELECT COUNT(*) FROM races WHERE championship_id = c.id)::int as races,
      (SELECT COUNT(*) FROM races WHERE championship_id = c.id AND status = 'completed')::int as completed
    FROM championships c WHERE c.created_by = $1
    ORDER BY c.updated_at DESC
  `, [req.user!.id]) as any[];
  try {
    const collabChamps = await db.query(`
      SELECT c.id, c.name, c.season, c.status,
        (SELECT COUNT(*) FROM drivers WHERE championship_id = c.id)::int as drivers,
        (SELECT COUNT(*) FROM races WHERE championship_id = c.id)::int as races,
        (SELECT COUNT(*) FROM races WHERE championship_id = c.id AND status = 'completed')::int as completed
      FROM championships c JOIN championship_collaborators cc ON c.id = cc.championship_id
      WHERE cc.user_id = $1
      ORDER BY c.updated_at DESC
    `, [req.user!.id]) as any[];
    const ownIds = new Set(championships.map((c: any) => c.id));
    for (const c of collabChamps) {
      if (!ownIds.has(c.id)) championships.push(c);
    }
  } catch {}

  const totalDrivers = championships.reduce((sum: number, c: any) => sum + c.drivers, 0);
  const totalRaces = championships.reduce((sum: number, c: any) => sum + c.races, 0);
  const totalCompleted = championships.reduce((sum: number, c: any) => sum + c.completed, 0);

  let recentResults = await db.query(`
    SELECT rr.*, r.name as race_name, r.date, c.name as championship_name, d.name as driver_name
    FROM race_results rr JOIN races r ON rr.race_id = r.id
    JOIN championships c ON r.championship_id = c.id
    JOIN drivers d ON rr.driver_id = d.id
    WHERE c.created_by = $1
    ORDER BY rr.created_at DESC LIMIT 20
  `, [req.user!.id]);
  try {
    const collabResults = await db.query(`
      SELECT rr.*, r.name as race_name, r.date, c.name as championship_name, d.name as driver_name
      FROM race_results rr JOIN races r ON rr.race_id = r.id
      JOIN championships c ON r.championship_id = c.id
      JOIN drivers d ON rr.driver_id = d.id
      JOIN championship_collaborators cc ON c.id = cc.championship_id
      WHERE cc.user_id = $1
      ORDER BY rr.created_at DESC LIMIT 20
    `, [req.user!.id]);
    recentResults = [...recentResults, ...collabResults].slice(0, 20);
  } catch {}

  res.json({
    championships_count: championships.length,
    total_drivers: totalDrivers,
    total_races: totalRaces,
    total_completed: totalCompleted,
    championships,
    recent_results: recentResults,
  });
}));

router.get('/users', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  const search = req.query.search as string || '';
  let query = 'SELECT id, username, email, role, avatar, discord_id, created_at FROM users';
  const params: any[] = [];
  if (search) { query += ' WHERE username LIKE $1 OR email LIKE $2'; params.push(`%${search}%`, `%${search}%`); }
  query += ' ORDER BY created_at DESC LIMIT 50';
  res.json(await db.query(query, params));
}));

router.get('/elite-users', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  const users = await db.query("SELECT id, username, email, avatar FROM users WHERE role = 'elite' AND id != $1 ORDER BY username ASC", [req.user!.id]);
  res.json(users);
}));

router.put('/users/:id/role', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.body;
  if (!['standard', 'elite'].includes(role)) { res.status(400).json({ error: 'Invalid role' }); return; }
  await db.execute("UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2", [role, req.params.id]);
  const user = await db.queryOne('SELECT id, username, email, role FROM users WHERE id = $1', [req.params.id]);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json(user);
}));

export default router;
