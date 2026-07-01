import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function RaceDetail() {
  const { id } = useParams<{ id: string }>();
  const [race, setRace] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.races.get(id).then(setRace).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><div className="loading"><div className="spinner" /></div></div>;
  if (!race) return <div className="page"><div className="empty-state"><h3>Race not found</h3></div></div>;

  const results = race.results || [];
  const topPole = results.find((r: any) => r.pole_position);
  const topFL = results.find((r: any) => r.fastest_lap);
  const winner = results.find((r: any) => r.position === 1);

  return (
    <div className="page">
      <div className="container">
        <Link to={`/championships/${race.championship_id}`} style={{ color: 'var(--text-secondary)', marginBottom: 12, display: 'inline-block', fontSize: '0.85rem' }}>
          ← Back to series
        </Link>

        <div className="card" style={{ marginBottom: 20, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 }}>{race.name}</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{race.circuit}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                {new Date(race.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · {race.weather}
              </p>
            </div>
            <span className={`badge ${race.status === 'completed' ? 'badge-green' : race.status === 'in_progress' ? 'badge-orange' : 'badge-blue'}`}>
              {race.status === 'completed' ? 'Finished' : race.status === 'in_progress' ? 'Live' : 'Scheduled'}
            </span>
          </div>
        </div>

        {race.status === 'completed' && (
          <div className="grid grid-4" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="value" style={{ fontSize: '1.2rem' }}>{winner?.driver_name || '—'}</div>
              <div className="label">Winner</div>
            </div>
            <div className="stat-card">
              <div className="value" style={{ fontSize: '1.2rem' }}>{topPole?.driver_name || '—'}</div>
              <div className="label">Pole Position</div>
            </div>
            <div className="stat-card">
              <div className="value" style={{ fontSize: '1.2rem' }}>{topFL?.driver_name || '—'}</div>
              <div className="label">Fastest Lap</div>
            </div>
            <div className="stat-card">
              <div className="value" style={{ fontSize: '1.2rem' }}>{results.length}</div>
              <div className="label">Classified Drivers</div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <span className="card-title">Classification</span>
            {race.status === 'completed' && (
              <button className="btn btn-ghost btn-sm" onClick={() => {
                api.races.export(race.id, 'csv').then((data: any) => {
                  if (typeof data === 'string') {
                    const blob = new Blob([data], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${race.name}-results.csv`;
                    a.click();
                  }
                });
              }}>CSV</button>
            )}
          </div>
          {results.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24, fontSize: '0.85rem' }}>No results yet</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Pos</th><th>Driver</th><th>No.</th><th>Team</th><th>Points</th><th>QL</th><th>Pole</th><th>FL</th><th>DNF</th><th>Penalties</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r: any) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>
                        {r.position === 1 && '🥇 '}
                        {r.position === 2 && '🥈 '}
                        {r.position === 3 && '🥉 '}
                        {r.position}°
                      </td>
                      <td><Link to={`/drivers/${r.driver_id}`} style={{ color: 'var(--text)', fontWeight: 500 }}>{r.driver_name}</Link></td>
                      <td style={{ color: 'var(--text-muted)' }}>#{r.driver_number}</td>
                      <td><span style={{ color: r.team_color || 'var(--text-muted)' }}>■ </span>{r.team_name || '-'}</td>
                      <td style={{ fontWeight: 700 }}>{r.points}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{r.qualifying_position != null ? `P${r.qualifying_position}` : '—'}</td>
                      <td>{r.pole_position ? '✓' : '—'}</td>
                      <td>{r.fastest_lap ? '✓' : '—'}</td>
                      <td>{r.dnf ? <span className="badge badge-red">DNF</span> : '—'}</td>
                      <td style={{ color: 'var(--accent-red)', fontSize: '0.82rem' }}>{r.penalties || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
