import { Router, Response } from 'express';
import { getDb, saveDb } from '../database/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user!.id);
  const unread = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0').get(req.user!.id) as any;
  res.json({ notifications, unread_count: unread?.count || 0 });
});

router.put('/:id/read', authenticate, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  saveDb();
  res.json({ message: 'Marked as read' });
});

router.put('/read-all', authenticate, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user!.id);
  saveDb();
  res.json({ message: 'All marked as read' });
});

export default router;
