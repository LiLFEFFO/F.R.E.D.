import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/schema';
import { authenticate, AuthRequest, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const news = await db.query(`
    SELECT n.*, u.username as author_name
    FROM news n LEFT JOIN users u ON n.author_id = u.id
    WHERE n.published = 1 ORDER BY n.created_at DESC
  `);
  res.json(news);
}));

router.get('/all', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'elite') { res.status(403).json({ error: 'ELITE role required' }); return; }
  const news = await db.query(`
    SELECT n.*, u.username as author_name
    FROM news n LEFT JOIN users u ON n.author_id = u.id
    ORDER BY n.created_at DESC
  `);
  res.json(news);
}));

router.get('/:id', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const item = await db.queryOne(`
    SELECT n.*, u.username as author_name
    FROM news n LEFT JOIN users u ON n.author_id = u.id
    WHERE n.id = $1
  `, [req.params.id]);
  if (!item) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(item);
}));

router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'elite') { res.status(403).json({ error: 'ELITE role required' }); return; }
  const { title, content, cover_image } = req.body;
  if (!title || !content) { res.status(400).json({ error: 'Title and content required' }); return; }
  const id = uuidv4();
  await db.execute('INSERT INTO news (id, title, content, cover_image, author_id) VALUES ($1, $2, $3, $4, $5)',
    [id, title, content, cover_image || '', req.user!.id]);
  const item = await db.queryOne('SELECT * FROM news WHERE id = $1', [id]);
  res.status(201).json(item);
}));

router.put('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'elite') { res.status(403).json({ error: 'ELITE role required' }); return; }
  const { title, content, cover_image, published } = req.body;
  await db.execute(`
    UPDATE news SET title = COALESCE($1, title), content = COALESCE($2, content),
    cover_image = COALESCE($3, cover_image), published = COALESCE($4, published),
    updated_at = NOW() WHERE id = $5
  `, [title, content, cover_image, published !== undefined ? (published ? 1 : 0) : null, req.params.id]);
  const item = await db.queryOne('SELECT * FROM news WHERE id = $1', [req.params.id]);
  res.json(item);
}));

router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const item = await db.queryOne('SELECT * FROM news WHERE id = $1', [req.params.id]) as any;
  if (!item) { res.status(404).json({ error: 'Not found' }); return; }
  if (req.user?.role !== 'elite' || (item.author_id && item.author_id !== req.user!.id)) {
    res.status(403).json({ error: 'Not authorized' }); return;
  }
  await db.execute('DELETE FROM news WHERE id = $1', [req.params.id]);
  res.json({ message: 'Deleted' });
}));

export default router;
