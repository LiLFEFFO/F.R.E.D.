import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/schema';
import { authenticate, requireElite, optionalAuth, AuthRequest, canManageChampionship } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const championship_id = req.query.championship_id as string;
  let query = `SELECT t.*,
    (SELECT COUNT(*) FROM drivers WHERE team_id = t.id)::int as driver_count,
    (SELECT d.name FROM drivers d WHERE d.id = t.reserve_driver_id) as reserve_driver_name
    FROM teams t`;
  const params: any[] = [];
  if (championship_id) {
    query += ' WHERE t.championship_id = $1';
    params.push(championship_id);
  }
  query += ' ORDER BY t.name ASC';
  res.json(await db.query(query, params));
}));

router.post('/', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { championship_id, name, color, logo, livery, reserve_driver_id } = req.body;
  if (!championship_id || !name) { res.status(400).json({ error: 'Championship and name required' }); return; }
  if (!await canManageChampionship(championship_id, req.user!.id)) {
    res.status(403).json({ error: 'Not authorized' }); return;
  }
  const id = uuidv4();
  await db.execute('INSERT INTO teams (id, championship_id, name, color, logo, livery, reserve_driver_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [id, championship_id, name, color || '#e10600', logo || '', livery || '', reserve_driver_id || null]);
  res.status(201).json(await db.queryOne('SELECT * FROM teams WHERE id = $1', [id]));
}));

router.put('/:id', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  const team = await db.queryOne('SELECT t.* FROM teams t WHERE t.id = $1', [req.params.id]) as any;
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
  if (!await canManageChampionship(team.championship_id, req.user!.id)) {
    res.status(403).json({ error: 'Not authorized' }); return;
  }
  const { name, color, logo, livery, reserve_driver_id } = req.body;
  await db.execute('UPDATE teams SET name = COALESCE($1, name), color = COALESCE($2, color), logo = COALESCE($3, logo), livery = COALESCE($4, livery), reserve_driver_id = COALESCE($5, reserve_driver_id) WHERE id = $6',
    [name, color, logo, livery, reserve_driver_id ?? null, req.params.id]);
  res.json(await db.queryOne('SELECT * FROM teams WHERE id = $1', [req.params.id]));
}));

router.delete('/:id', authenticate, requireElite, asyncHandler(async (req: AuthRequest, res: Response) => {
  const team = await db.queryOne('SELECT t.id, t.championship_id FROM teams t WHERE t.id = $1', [req.params.id]) as any;
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
  if (!await canManageChampionship(team.championship_id, req.user!.id)) {
    res.status(403).json({ error: 'Not authorized' }); return;
  }
  await db.execute('DELETE FROM teams WHERE id = $1', [req.params.id]);
  res.json({ message: 'Team deleted' });
}));

export default router;
