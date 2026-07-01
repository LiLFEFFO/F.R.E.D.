import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from '../database/schema';
import { authenticate, AuthRequest, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const news = db.prepare(`
    SELECT n.*, u.username as author_name
    FROM news n
    LEFT JOIN users u ON n.author_id = u.id
    WHERE n.published = 1
    ORDER BY n.created_at DESC
  `).all();
  res.json(news);
});

router.get('/all', authenticate, (req: AuthRequest, res: Response): void => {
  if (req.user?.role !== 'elite') {
    res.status(403).json({ error: 'ELITE role required' });
    return;
  }
  const db = getDb();
  const news = db.prepare(`
    SELECT n.*, u.username as author_name
    FROM news n
    LEFT JOIN users u ON n.author_id = u.id
    ORDER BY n.created_at DESC
  `).all();
  res.json(news);
});

router.get('/:id', optionalAuth, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const item = db.prepare(`
    SELECT n.*, u.username as author_name
    FROM news n
    LEFT JOIN users u ON n.author_id = u.id
    WHERE n.id = ?
  `).get(req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(item);
});

router.post('/', authenticate, (req: AuthRequest, res: Response): void => {
  if (req.user?.role !== 'elite') {
    res.status(403).json({ error: 'ELITE role required' });
    return;
  }
  const { title, content, cover_image } = req.body;
  if (!title || !content) {
    res.status(400).json({ error: 'Title and content required' });
    return;
  }
  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO news (id, title, content, cover_image, author_id) VALUES (?, ?, ?, ?, ?)')
    .run(id, title, content, cover_image || '', req.user!.id);
  saveDb();
  const item = db.prepare('SELECT * FROM news WHERE id = ?').get(id);
  res.status(201).json(item);
});

router.put('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  if (req.user?.role !== 'elite') {
    res.status(403).json({ error: 'ELITE role required' });
    return;
  }
  const { title, content, cover_image, published } = req.body;
  const db = getDb();
  db.prepare(`
    UPDATE news SET title = COALESCE(?, title), content = COALESCE(?, content),
    cover_image = COALESCE(?, cover_image), published = COALESCE(?, published),
    updated_at = datetime('now') WHERE id = ?
  `).run(title, content, cover_image, published !== undefined ? (published ? 1 : 0) : null, req.params.id);
  saveDb();
  const item = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
  res.json(item);
});

router.delete('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const item = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id) as any;
  if (!item) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  if (req.user?.role !== 'elite' || (item.author_id && item.author_id !== req.user!.id)) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }
  db.prepare('DELETE FROM news WHERE id = ?').run(req.params.id);
  saveDb();
  res.json({ message: 'Deleted' });
});

export default router;
