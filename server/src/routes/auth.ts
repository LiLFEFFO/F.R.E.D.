import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/schema';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/register', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400).json({ error: 'All fields required' });
    return;
  }
  const existing = await db.queryOne('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
  if (existing) {
    res.status(409).json({ error: 'Username or email already exists' });
    return;
  }
  const id = uuidv4();
  const hashed = bcrypt.hashSync(password, 10);
  await db.execute('INSERT INTO users (id, username, email, password) VALUES ($1, $2, $3, $4)', [id, username, email, hashed]);
  const token = generateToken({ id, username, email, role: 'standard' });
  res.status(201).json({ token, user: { id, username, email, role: 'standard', avatar: '', discord_id: '' } });
}));

router.post('/login', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }
  const user = await db.queryOne('SELECT * FROM users WHERE email = $1', [email]) as any;
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const token = generateToken({ id: user.id, username: user.username, email: user.email, role: user.role });
  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role, avatar: user.avatar, discord_id: user.discord_id }
  });
}));

router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT id, username, email, role, avatar, discord_id, created_at FROM users WHERE id = $1', [req.user!.id]);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
}));

router.post('/upgrade-elite', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { password } = req.body;
  if (password !== 'ELITEchamporg') {
    res.status(403).json({ error: 'Invalid ELITE password' });
    return;
  }
  await db.execute("UPDATE users SET role = 'elite', updated_at = NOW() WHERE id = $1", [req.user!.id]);
  const user = await db.queryOne('SELECT id, username, email, role, avatar, discord_id, created_at FROM users WHERE id = $1', [req.user!.id]);
  const token = generateToken({ id: user.id, username: user.username, email: user.email, role: 'elite' });
  res.json({ token, user });
}));

router.put('/profile', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { username, avatar, discord_id } = req.body;
  if (username) await db.execute("UPDATE users SET username = $1, updated_at = NOW() WHERE id = $2", [username, req.user!.id]);
  if (avatar !== undefined) await db.execute("UPDATE users SET avatar = $1, updated_at = NOW() WHERE id = $2", [avatar, req.user!.id]);
  if (discord_id !== undefined) await db.execute("UPDATE users SET discord_id = $1, updated_at = NOW() WHERE id = $2", [discord_id, req.user!.id]);
  const user = await db.queryOne('SELECT id, username, email, role, avatar, discord_id, created_at FROM users WHERE id = $1', [req.user!.id]);
  res.json(user);
}));

export default router;
