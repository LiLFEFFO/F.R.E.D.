import { Router, Response } from 'express';
import { db } from '../database/schema';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const notifications = await db.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user!.id]);
  const unread = await db.queryOne('SELECT COUNT(*)::int as count FROM notifications WHERE user_id = $1 AND read = 0', [req.user!.id]);
  res.json({ notifications, unread_count: unread?.count || 0 });
}));

router.put('/:id/read', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  await db.execute('UPDATE notifications SET read = 1 WHERE id = $1 AND user_id = $2', [req.params.id, req.user!.id]);
  res.json({ message: 'Marked as read' });
}));

router.put('/read-all', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  await db.execute('UPDATE notifications SET read = 1 WHERE user_id = $1', [req.user!.id]);
  res.json({ message: 'All marked as read' });
}));

export default router;
