import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from '../database/schema';
import { authenticate, requireElite, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const championship_id = req.query.championship_id as string;
  let query = `SELECT t.*,
    (SELECT COUNT(*) FROM drivers WHERE team_id = t.id) as driver_count,
    (SELECT d.name FROM drivers d WHERE d.id = t.reserve_driver_id) as reserve_driver_name
    FROM teams t`;
  const params: any[] = [];
  if (championship_id) {
    query += ' WHERE t.championship_id = ?';
    params.push(championship_id);
  }
  query += ' ORDER BY t.name ASC';
  res.json(db.prepare(query).all(...params));
});

router.post('/', authenticate, requireElite, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const { championship_id, name, color, logo, livery, reserve_driver_id } = req.body;
  if (!championship_id || !name) {
    res.status(400).json({ error: 'Championship and name required' });
    return;
  }
  const champ = db.prepare('SELECT id FROM championships WHERE id = ? AND created_by = ?').get(championship_id, req.user!.id);
  if (!champ) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }
  const id = uuidv4();
  db.prepare('INSERT INTO teams (id, championship_id, name, color, logo, livery, reserve_driver_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, championship_id, name, color || '#e10600', logo || '', livery || '', reserve_driver_id || null);
  saveDb();
  res.status(201).json(db.prepare('SELECT * FROM teams WHERE id = ?').get(id));
});

router.put('/:id', authenticate, requireElite, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const team = db.prepare('SELECT t.* FROM teams t JOIN championships c ON t.championship_id = c.id WHERE t.id = ? AND c.created_by = ?').get(req.params.id, req.user!.id) as any;
  if (!team) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }
  const { name, color, logo, livery, reserve_driver_id } = req.body;
  db.prepare('UPDATE teams SET name = COALESCE(?, name), color = COALESCE(?, color), logo = COALESCE(?, logo), livery = COALESCE(?, livery), reserve_driver_id = COALESCE(?, reserve_driver_id) WHERE id = ?')
    .run(name, color, logo, livery, reserve_driver_id ?? null, req.params.id);
  saveDb();
  res.json(db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id));
});

router.delete('/:id', authenticate, requireElite, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const team = db.prepare('SELECT t.id FROM teams t JOIN championships c ON t.championship_id = c.id WHERE t.id = ? AND c.created_by = ?').get(req.params.id, req.user!.id);
  if (!team) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }
  db.prepare('DELETE FROM teams WHERE id = ?').run(req.params.id);
  saveDb();
  res.json({ message: 'Team deleted' });
});

export default router;
