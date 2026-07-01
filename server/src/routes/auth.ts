import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from '../database/schema';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', (req: AuthRequest, res: Response): void => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400).json({ error: 'All fields required' });
    return;
  }
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    res.status(409).json({ error: 'Username or email already exists' });
    return;
  }
  const id = uuidv4();
  const hashed = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)').run(id, username, email, hashed);
  saveDb();
  const token = generateToken({ id, username, email, role: 'standard' });
  res.status(201).json({ token, user: { id, username, email, role: 'standard', avatar: '', discord_id: '' } });
});

router.post('/login', (req: AuthRequest, res: Response): void => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const token = generateToken({ id: user.id, username: user.username, email: user.email, role: user.role });
  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role, avatar: user.avatar, discord_id: user.discord_id }
  });
});

router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const user = db.prepare('SELECT id, username, email, role, avatar, discord_id, created_at FROM users WHERE id = ?').get(req.user!.id) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});

router.post('/upgrade-elite', authenticate, (req: AuthRequest, res: Response): void => {
  const { password } = req.body;
  if (password !== 'ELITEchamporg') {
    res.status(403).json({ error: 'Invalid ELITE password' });
    return;
  }
  const db = getDb();
  db.prepare('UPDATE users SET role = ?, updated_at = datetime("now") WHERE id = ?').run('elite', req.user!.id);
  saveDb();
  const user = db.prepare('SELECT id, username, email, role, avatar, discord_id, created_at FROM users WHERE id = ?').get(req.user!.id);
  const token = generateToken({ id: user.id, username: user.username, email: user.email, role: 'elite' });
  res.json({ token, user });
});

router.put('/profile', authenticate, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const { username, avatar, discord_id } = req.body;
  if (username) db.prepare('UPDATE users SET username = ?, updated_at = datetime("now") WHERE id = ?').run(username, req.user!.id);
  if (avatar !== undefined) db.prepare('UPDATE users SET avatar = ?, updated_at = datetime("now") WHERE id = ?').run(avatar, req.user!.id);
  if (discord_id !== undefined) db.prepare('UPDATE users SET discord_id = ?, updated_at = datetime("now") WHERE id = ?').run(discord_id, req.user!.id);
  saveDb();
  const user = db.prepare('SELECT id, username, email, role, avatar, discord_id, created_at FROM users WHERE id = ?').get(req.user!.id);
  res.json(user);
});

export default router;
