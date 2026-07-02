import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from '../database/schema';
import { authenticate, requireElite, optionalAuth, AuthRequest } from '../middleware/auth';
import { recalculateChampionship, getPointsForPosition } from '../services/scoring';

const router = Router();

router.get('/', optionalAuth, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const championship_id = req.query.championship_id as string;
  let query = 'SELECT * FROM races';
  const params: any[] = [];
  if (championship_id) {
    query += ' WHERE championship_id = ?';
    params.push(championship_id);
  }
  query += ' ORDER BY date ASC';
  res.json(db.prepare(query).all(...params));
});

router.get('/:id', optionalAuth, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const race = db.prepare('SELECT * FROM races WHERE id = ?').get(req.params.id) as any;
  if (!race) {
    res.status(404).json({ error: 'Race not found' });
    return;
  }
  const results = db.prepare(`
    SELECT rr.*, d.name as driver_name, d.number as driver_number, d.avatar, d.team_id,
      t.name as team_name, t.color as team_color
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    LEFT JOIN teams t ON d.team_id = t.id
    WHERE rr.race_id = ?
    ORDER BY rr.position ASC
  `).all(race.id);

  const sc = db.prepare('SELECT * FROM scoring_systems WHERE championship_id = ?').get(race.championship_id) as any;

  res.json({ ...race, results, scoring: sc });
});

router.post('/', authenticate, requireElite, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const { championship_id, name, circuit, date, weather } = req.body;
  if (!championship_id || !name || !circuit || !date) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  const champ = db.prepare('SELECT id FROM championships WHERE id = ? AND created_by = ?').get(championship_id, req.user!.id);
  if (!champ) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }
  const id = uuidv4();
  db.prepare('INSERT INTO races (id, championship_id, name, circuit, date, weather) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, championship_id, name, circuit, date, weather || 'Dry');
  saveDb();
  res.status(201).json(db.prepare('SELECT * FROM races WHERE id = ?').get(id));
});

router.put('/:id', authenticate, requireElite, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const race = db.prepare('SELECT r.* FROM races r JOIN championships c ON r.championship_id = c.id WHERE r.id = ? AND c.created_by = ?').get(req.params.id, req.user!.id) as any;
  if (!race) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }
  const { name, circuit, date, weather, status } = req.body;
  db.prepare('UPDATE races SET name = COALESCE(?, name), circuit = COALESCE(?, circuit), date = COALESCE(?, date), weather = COALESCE(?, weather), status = COALESCE(?, status), updated_at = datetime("now") WHERE id = ?')
    .run(name, circuit, date, weather, status, req.params.id);
  saveDb();
  res.json(db.prepare('SELECT * FROM races WHERE id = ?').get(req.params.id));
});

router.delete('/:id', authenticate, requireElite, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const race = db.prepare('SELECT r.id, r.championship_id FROM races r JOIN championships c ON r.championship_id = c.id WHERE r.id = ? AND c.created_by = ?').get(req.params.id, req.user!.id) as any;
  if (!race) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }
  db.prepare('DELETE FROM races WHERE id = ?').run(req.params.id);
  db.prepare('DELETE FROM race_results WHERE race_id = ?').run(req.params.id);
  saveDb();
  recalculateChampionship(race.championship_id);
  saveDb();
  res.json({ message: 'Race deleted' });
});

router.post('/:id/results', authenticate, requireElite, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const race = db.prepare('SELECT r.*, c.created_by as owner_id FROM races r JOIN championships c ON r.championship_id = c.id WHERE r.id = ?').get(req.params.id) as any;
  if (!race || race.owner_id !== req.user!.id) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  const sc = db.prepare('SELECT * FROM scoring_systems WHERE championship_id = ?').get(race.championship_id) as any;
  const pointsArray = sc ? JSON.parse(sc.position_points) : [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

  const { results } = req.body;
  if (!results || !Array.isArray(results)) {
    res.status(400).json({ error: 'Results array required' });
    return;
  }

  db.prepare('DELETE FROM race_results WHERE race_id = ?').run(race.id);
  db.prepare('UPDATE races SET status = ?, updated_at = datetime("now") WHERE id = ?').run('completed', race.id);

  const insertResult = db.prepare(`
    INSERT INTO race_results (id, race_id, driver_id, position, points, pole_position, fastest_lap, dnf, present, qualifying_position, penalties, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const r of results) {
    const basePoints = (!r.dnf && r.present !== false && r.position <= pointsArray.length) ? pointsArray[r.position - 1] : 0;
    let totalPoints = basePoints;
    if (r.pole_position && sc && r.present !== false) totalPoints += sc.pole_bonus;
    if (r.fastest_lap && sc && r.present !== false) totalPoints += sc.fastest_lap_bonus;

    insertResult.run(
      uuidv4(), race.id, r.driver_id, r.position, totalPoints,
      r.pole_position ? 1 : 0, r.fastest_lap ? 1 : 0, r.dnf ? 1 : 0,
      r.present !== false ? 1 : 0,
      r.qualifying_position != null ? r.qualifying_position : null,
      r.penalties || '', r.notes || ''
    );
  }

  saveDb();
  recalculateChampionship(race.championship_id);
  saveDb();

  const updatedResults = db.prepare(`
    SELECT rr.*, d.name as driver_name, d.number as driver_number
    FROM race_results rr JOIN drivers d ON rr.driver_id = d.id
    WHERE rr.race_id = ? ORDER BY rr.position ASC
  `).all(race.id);

  const usersToNotify = db.prepare(`
    SELECT DISTINCT u.id FROM users u
    JOIN drivers d ON d.user_id = u.id
    WHERE d.championship_id = ?
  `).all(race.championship_id) as any[];

  for (const u of usersToNotify) {
    db.prepare('INSERT INTO notifications (id, user_id, message, type) VALUES (?, ?, ?, ?)')
      .run(uuidv4(), u.id, `New results published for ${race.name}`, 'result');
  }

  res.json({ race_id: race.id, results: updatedResults });
});

router.get('/:id/export', optionalAuth, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const race = db.prepare('SELECT * FROM races WHERE id = ?').get(req.params.id) as any;
  if (!race) {
    res.status(404).json({ error: 'Race not found' });
    return;
  }
  const results = db.prepare(`
    SELECT rr.position, d.name as driver, d.number, t.name as team, rr.points, rr.pole_position, rr.fastest_lap, rr.dnf, rr.penalties
    FROM race_results rr
    JOIN drivers d ON rr.driver_id = d.id
    LEFT JOIN teams t ON d.team_id = t.id
    WHERE rr.race_id = ?
    ORDER BY rr.position ASC
  `).all(race.id);

  const format = req.query.format || 'json';
  if (format === 'csv') {
    let csv = 'Position,Driver,Number,Team,Points,Pole,Fastest Lap,DNF,Penalties\n';
    for (const r of results as any[]) {
      csv += `${r.position},"${r.driver}",${r.number},"${r.team}",${r.points},${r.pole_position ? 'Yes' : 'No'},${r.fastest_lap ? 'Yes' : 'No'},${r.dnf ? 'Yes' : 'No'},"${r.penalties}"\n`;
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${race.name}-results.csv"`);
    res.send(csv);
  } else {
    res.json({ race, results });
  }
});

router.put('/:id/reopen', authenticate, requireElite, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const race = db.prepare('SELECT r.*, c.created_by as owner_id FROM races r JOIN championships c ON r.championship_id = c.id WHERE r.id = ?').get(req.params.id) as any;
  if (!race || race.owner_id !== req.user!.id) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }
  db.prepare("UPDATE races SET status = 'scheduled', updated_at = datetime('now') WHERE id = ?").run(race.id);
  db.prepare('DELETE FROM race_results WHERE race_id = ?').run(race.id);
  saveDb();
  res.json(db.prepare('SELECT * FROM races WHERE id = ?').get(race.id));
});

export default router;
