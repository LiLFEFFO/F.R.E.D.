import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { initSchema, db } from './database/schema';
import authRoutes from './routes/auth';
import championshipRoutes from './routes/championships';
import driverRoutes from './routes/drivers';
import teamRoutes from './routes/teams';
import raceRoutes from './routes/races';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notifications';
import newsRoutes from './routes/news';
import uploadRoutes from './routes/upload';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/championships', championshipRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/races', raceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const distPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(distPath));
app.get('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

async function seedIfEmpty() {
  const userCount = await db.queryOne('SELECT COUNT(*)::int as cnt FROM users');
  if (userCount?.cnt === 0) {
    console.log('Database is empty, seeding...');
    const { default: seed } = await import('./database/seed');
    await seed();
  }
}

initSchema().then(async () => {
  await seedIfEmpty();
  app.listen(PORT, () => {
    console.log(`F.R.E.D. API server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
