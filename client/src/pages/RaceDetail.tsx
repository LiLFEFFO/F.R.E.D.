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
        <Link to={`/championships/${race.championship_id}`} className="btn btn-ghost btn-sm mb-4" style={{ display: 'inline-flex' }}>
          ← Back to series
        </Link>

        <div className="race-hero card fade-in" style={{ marginBottom: 24, padding: 28 }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="race-title">{race.name}</h1>
                <span className={`badge ${race.status === 'completed' ? 'badge-green' : race.status === 'in_progress' ? 'badge-orange' : 'badge-blue'}`}>
                  {race.status === 'completed' ? 'Finished' : race.status === 'in_progress' ? 'Live' : 'Scheduled'}
                </span>
              </div>
              <p className="text-lg text-secondary">{race.circuit}</p>
              <p className="text-sm text-muted mt-1">
                {new Date(race.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}{race.weather ? ` · ${race.weather}` : ''}
              </p>
            </div>
          </div>
        </div>

        {race.status === 'completed' && (
          <div className="grid grid-4 mb-6">
            <div className="stat-card">
              <span className="stat-icon">🥇</span>
              <div className="value" style={{ fontSize: '1rem' }}>{winner?.driver_name || '—'}</div>
              <div className="label">Winner</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">🏎️</span>
              <div className="value" style={{ fontSize: '1rem' }}>{topPole?.driver_name || '—'}</div>
              <div className="label">Pole Position</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">⏱️</span>
              <div className="value" style={{ fontSize: '1rem' }}>{topFL?.driver_name || '—'}</div>
              <div className="label">Fastest Lap</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">🏁</span>
              <div className="value" style={{ fontSize: '1rem' }}>{results.length}</div>
              <div className="label">Classified</div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <span className="card-title">Classification</span>
            {race.status === 'completed' && (
              <button className="btn btn-secondary btn-sm" onClick={() => {
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
              }}>Export CSV</button>
            )}
          </div>
          {results.length === 0 ? (
            <p className="text-muted text-center p-5">No results yet</p>
          ) : (
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Pos</th><th>Driver</th><th>No.</th><th>Team</th><th>Points</th><th>QL</th><th>Pole</th><th>FL</th><th>DNF</th><th>Status</th><th>Penalties</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r: any) => (
                    <tr key={r.id} className={r.position <= 3 ? 'podium-row' : ''}>
                      <td className="pos-cell">
                        <span className={`pos-badge ${r.position === 1 ? 'gold' : r.position === 2 ? 'silver' : r.position === 3 ? 'bronze' : ''}`}>
                          {r.position}°
                        </span>
                      </td>
                      <td><Link to={`/drivers/${r.driver_id}`} className="driver-link">{r.driver_name}</Link></td>
                      <td className="text-muted text-sm">#{r.driver_number}</td>
                      <td><span className="team-dot" style={{ background: r.team_color || 'var(--text-muted)' }} />{r.team_name || '-'}</td>
                      <td className="font-bold">{r.points}</td>
                      <td className="text-muted text-sm">{r.qualifying_position != null ? `P${r.qualifying_position}` : '—'}</td>
                      <td>{r.pole_position ? <span className="badge badge-cyan">P</span> : '—'}</td>
                      <td>{r.fastest_lap ? <span className="badge badge-purple">FL</span> : '—'}</td>
                      <td>{r.dnf ? <span className="badge badge-red">DNF</span> : '—'}</td>
                      <td>{r.present === 0 ? <span className="badge badge-orange">Absent</span> : <span className="badge badge-green">Present</span>}</td>
                      <td className="text-red text-sm">{r.penalties || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .race-hero {
          border-left: 4px solid var(--accent);
        }
        .race-title { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }
        .pos-cell { width: 60px; }
        .pos-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 50%;
          font-weight: 700; font-size: 0.82rem;
          background: var(--bg-secondary); color: var(--text);
        }
        .pos-badge.gold { background: var(--accent-gold-light); color: var(--accent-gold); }
        .pos-badge.silver { background: rgba(148,163,184,0.15); color: #94a3b8; }
        .pos-badge.bronze { background: rgba(180,83,9,0.12); color: #b45309; }
        .driver-link { color: var(--text); font-weight: 500; }
        .driver-link:hover { color: var(--accent); }
        .team-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
        .podium-row td { background: var(--bg-secondary); }
        @media (max-width: 600px) {
          .race-title { font-size: 1.2rem; }
        }
      `}</style>
    </div>
  );
}
