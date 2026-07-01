import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Championship, DriverStanding, ConstructorStanding } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
        <Link to={`/championships/${champ.id}`} style={{ color: 'var(--text-secondary)', marginBottom: 12, display: 'inline-block', fontSize: '0.85rem' }}>
          ← Back to {champ.name}
        </Link>
        <h1 className="section-title">Standings — {champ.name}</h1>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Driver Standings</span>
              <input
                type="text"
                placeholder="Search driver..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 180, padding: '5px 8px', fontSize: '0.8rem' }}
              />
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Driver</th><th>Team</th><th>Points</th><th>Wins</th><th>Podiums</th><th>Poles</th><th>FL</th><th>Races</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.map(d => (
                    <tr key={d.driver_id}
                      style={{ cursor: 'pointer', background: selectedDriver === d.driver_id ? 'rgba(37,99,235,0.05)' : undefined }}
                      onClick={() => setSelectedDriver(d.driver_id === selectedDriver ? null : d.driver_id)}
                    >
                      <td style={{ fontWeight: 600 }}>
                        {d.position}
                        <PositionIndicator current={d.position} previous={d.previous_position} />
                      </td>
                      <td>
                        <Link to={`/drivers/${d.driver_id}`} style={{ color: 'var(--text)', fontWeight: 500 }} onClick={e => e.stopPropagation()}>
                          {d.driver_name}
                        </Link>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontSize: '0.75rem' }}>#{d.driver_number}</span>
                      </td>
                      <td><span style={{ color: d.team_color || 'var(--text-muted)' }}>■ </span>{d.team_name || '-'}</td>
                      <td style={{ fontWeight: 700 }}>{d.points}</td>
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

          <div className="card">
            <div className="card-header">
              <span className="card-title">Constructor Standings</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>#</th><th>Team</th><th>Points</th><th>Drivers</th></tr>
                </thead>
                <tbody>
                  {constructorSt.map(c => (
                    <tr key={c.team_id}>
                      <td style={{ fontWeight: 600 }}>
                        {c.position}
                        <PositionIndicator current={c.position} previous={c.previous_position} />
                      </td>
                      <td><span style={{ color: c.team_color || 'var(--text-muted)' }}>■ </span><strong>{c.team_name}</strong></td>
                      <td style={{ fontWeight: 700 }}>{c.points}</td>
                      <td>{c.driver_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {stats?.drivers && (
          <>
            <h2 className="section-title" style={{ marginTop: 40 }}>Driver Stats</h2>
            <div className="grid grid-3">
              {stats.drivers.map((d: any) => (
                <div key={d.id} className="card" style={{ cursor: 'pointer', padding: 16 }} onClick={() => setSelectedDriver(d.id === selectedDriver ? null : d.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <h3 style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.name}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        <span style={{ color: d.team_color }}>■</span> {d.team_name}
                      </p>
                    </div>
                    <div className={`badge ${d.position === 1 ? 'badge-gold' : ''}`}>#{d.position}</div>
                  </div>
                  <div className="grid grid-2" style={{ gap: 6, textAlign: 'center' }}>
                    <div className="stat-card" style={{ padding: 10 }}><div className="value" style={{ fontSize: '1.1rem' }}>{d.points}</div><div className="label">Pts</div></div>
                    <div className="stat-card" style={{ padding: 10 }}><div className="value" style={{ fontSize: '1.1rem' }}>{d.wins}</div><div className="label">Wins</div></div>
                    <div className="stat-card" style={{ padding: 10 }}><div className="value" style={{ fontSize: '1.1rem' }}>{d.podiums}</div><div className="label">Podiums</div></div>
                    <div className="stat-card" style={{ padding: 10 }}><div className="value" style={{ fontSize: '1.1rem' }}>{d.avg_points}</div><div className="label">Avg</div></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PositionIndicator({ current, previous }: { current: number; previous: number }) {
  if (!previous || previous === 0) return <span className="position-same" style={{ fontSize: '0.75rem', marginLeft: 4 }}>–</span>;
  if (current < previous) return <span className="position-up" style={{ fontSize: '0.75rem', marginLeft: 4 }}>▲{previous - current}</span>;
  if (current > previous) return <span className="position-down" style={{ fontSize: '0.75rem', marginLeft: 4 }}>▼{current - previous}</span>;
  return <span className="position-same" style={{ fontSize: '0.75rem', marginLeft: 4 }}>–</span>;
}
