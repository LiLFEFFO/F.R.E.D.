import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Championship, DriverStanding, ConstructorStanding } from '../types';

export default function Standings() {
  const { id } = useParams<{ id: string }>();
  const [champ, setChamp] = useState<Championship | null>(null);
  const [standings, setStandings] = useState<{ driver_standings: DriverStanding[]; constructor_standings: ConstructorStanding[] } | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.championships.get(id),
      api.championships.standings(id),
      api.championships.statistics(id),
    ]).then(([c, s, st]) => {
      setChamp(c);
      setStandings(s);
      setStats(st);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><div className="loading"><div className="spinner" /></div></div>;
  if (!champ) return <div className="page"><div className="empty-state"><h3>Not found</h3></div></div>;

  const driverSt = standings?.driver_standings || [];
  const filteredDrivers = driverSt.filter(d =>
    d.driver_name.toLowerCase().includes(search.toLowerCase())
  );
  const constructorSt = standings?.constructor_standings || [];

  return (
    <div className="page">
      <div className="container">
        <Link to={`/championships/${champ.id}`} className="btn btn-ghost btn-sm mb-4" style={{ display: 'inline-flex' }}>
          ← Back to {champ.name}
        </Link>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h1 className="section-title" style={{ marginBottom: 0 }}>Standings — {champ.name}</h1>
          <Link to={`/championships/${champ.id}/statistics`} className="btn btn-secondary btn-sm">View Statistics</Link>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Drivers</span>
              <input
                type="text"
                placeholder="Search driver..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 180 }}
              />
            </div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Driver</th><th>Team</th><th>Points</th><th>Wins</th><th>Podiums</th><th>Poles</th><th>FL</th><th>Races</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.map(d => (
                    <tr key={d.driver_id}
                      className={selectedDriver === d.driver_id ? 'selected-row' : ''}
                      onClick={() => setSelectedDriver(d.driver_id === selectedDriver ? null : d.driver_id)}
                      style={{ cursor: 'pointer' }}>
                      <td className="font-bold">
                        <span className={`pos-indicator ${d.position === 1 ? 'gold' : d.position <= 3 ? 'podium' : ''}`}>
                          {d.position}
                        </span>
                        <PositionIndicator current={d.position} previous={d.previous_position} />
                      </td>
                      <td>
                        <Link to={`/drivers/${d.driver_id}`} style={{ color: 'var(--text)', fontWeight: 500 }} onClick={e => e.stopPropagation()}>
                          {d.driver_name}
                        </Link>
                        <span className="text-muted text-xs" style={{ marginLeft: 4 }}>#{d.driver_number}</span>
                      </td>
                      <td><span className="team-dot" style={{ background: d.team_color || 'var(--text-muted)' }} />{d.team_name || '-'}</td>
                      <td className="font-bold text-accent">{d.points}</td>
                      <td>{d.wins}</td>
                      <td>{d.podiums}</td>
                      <td>{d.poles}</td>
                      <td>{d.fastest_laps}</td>
                      <td>{d.races_done}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {constructorSt.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Constructors</span>
              </div>
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr><th>#</th><th>Team</th><th>Points</th><th>Drivers</th></tr>
                  </thead>
                  <tbody>
                    {constructorSt.map(c => (
                      <tr key={c.team_id}>
                        <td className="font-bold">
                          <span className={`pos-indicator ${c.position === 1 ? 'gold' : c.position <= 3 ? 'podium' : ''}`}>
                            {c.position}
                          </span>
                          <PositionIndicator current={c.position} previous={c.previous_position} />
                        </td>
                        <td><span className="team-dot" style={{ background: c.team_color || 'var(--text-muted)' }} /><strong>{c.team_name}</strong></td>
                        <td className="font-bold text-accent">{c.points}</td>
                        <td>{c.driver_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {stats?.drivers && (
          <section className="mt-8">
            <h2 className="section-title">Driver Stats</h2>
            <div className="grid grid-auto">
              {stats.drivers.map((d: any) => (
                <div key={d.id} className="card card-interactive" style={{ padding: 18 }} onClick={() => setSelectedDriver(d.id === selectedDriver ? null : d.id)}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold" style={{ fontSize: '0.9rem' }}>{d.name}</h3>
                      <p className="text-xs text-secondary">
                        <span className="team-dot" style={{ background: d.team_color }} /> {d.team_name}
                      </p>
                    </div>
                    <span className={`badge ${d.position === 1 ? 'badge-gold' : ''}`}>#{d.position}</span>
                  </div>
                  <div className="grid grid-2" style={{ gap: 8, textAlign: 'center' }}>
                    <div className="stat-card" style={{ padding: 10, background: 'var(--bg-secondary)' }}>
                      <div className="value" style={{ fontSize: '1.1rem' }}>{d.points}</div>
                      <div className="label">Pts</div>
                    </div>
                    <div className="stat-card" style={{ padding: 10, background: 'var(--bg-secondary)' }}>
                      <div className="value" style={{ fontSize: '1.1rem' }}>{d.wins}</div>
                      <div className="label">Wins</div>
                    </div>
                    <div className="stat-card" style={{ padding: 10, background: 'var(--bg-secondary)' }}>
                      <div className="value" style={{ fontSize: '1.1rem' }}>{d.podiums}</div>
                      <div className="label">Podiums</div>
                    </div>
                    <div className="stat-card" style={{ padding: 10, background: 'var(--bg-secondary)' }}>
                      <div className="value" style={{ fontSize: '1.1rem' }}>{d.avg_points}</div>
                      <div className="label">Avg</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <style>{`
        .pos-indicator {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 24px; font-weight: 700;
        }
        .pos-indicator.gold { color: var(--accent-gold); }
        .pos-indicator.podium { color: var(--accent-green); }
        .team-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
        .selected-row td { background: var(--accent-light); }
      `}</style>
    </div>
  );
}

function PositionIndicator({ current, previous }: { current: number; previous: number }) {
  if (!previous || previous === 0) return <span className="position-same text-xs" style={{ marginLeft: 2 }}>–</span>;
  if (current < previous) return <span className="position-up text-xs" style={{ marginLeft: 2 }}>▲{previous - current}</span>;
  if (current > previous) return <span className="position-down text-xs" style={{ marginLeft: 2 }}>▼{current - previous}</span>;
  return <span className="position-same text-xs" style={{ marginLeft: 2 }}>–</span>;
}
