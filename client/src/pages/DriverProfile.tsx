import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DriverProfile() {
  const { id } = useParams<{ id: string }>();
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.drivers.get(id).then(setDriver).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><div className="loading"><div className="spinner" /></div></div>;
  if (!driver) return <div className="page"><div className="empty-state"><h3>Driver not found</h3></div></div>;

  const results = driver.results || [];
  const chartData = results.map((r: any) => ({
    name: r.race_name?.substring(0, 12) || r.race_name,
    Points: r.points,
  }));
  const podiums = results.filter((r: any) => r.position <= 3).length;

  return (
    <div className="page">
      <div className="container">
        <Link to={`/championships/${driver.championship_id}`} style={{ color: 'var(--text-secondary)', marginBottom: 12, display: 'inline-block', fontSize: '0.85rem' }}>
          ← Back to series
        </Link>

        <div className="card" style={{ marginBottom: 20, padding: 20 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--bg-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', flexShrink: 0
            }}>
              {driver.avatar ? <img src={driver.avatar} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} /> : driver.name?.substring(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{driver.name}</h1>
                <span className="badge badge-blue">#{driver.number}</span>
                {driver.position && <span className={`badge ${driver.position === 1 ? 'badge-gold' : ''}`}>#{driver.position} in standings</span>}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <span style={{ color: driver.team_color }}>■</span> {driver.team_name || 'No team'} · {driver.championship_name} ({driver.season})
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card"><div className="value">{driver.points || 0}</div><div className="label">Points</div></div>
          <div className="stat-card"><div className="value">{driver.wins || 0}</div><div className="label">Wins</div></div>
          <div className="stat-card"><div className="value">{podiums}</div><div className="label">Podiums</div></div>
          <div className="stat-card"><div className="value">{driver.poles || 0}</div><div className="label">Pole Positions</div></div>
        </div>

        <div className="grid grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card"><div className="value">{driver.fastest_laps || 0}</div><div className="label">Fastest Laps</div></div>
          <div className="stat-card"><div className="value">{driver.races_done || 0}</div><div className="label">Races</div></div>
          <div className="stat-card"><div className="value">{driver.races_done > 0 ? (driver.points / driver.races_done).toFixed(1) : 0}</div><div className="label">Avg Points</div></div>
          <div className="stat-card"><div className="value">{driver.races_done > 0 ? ((podiums / driver.races_done) * 100).toFixed(1) : 0}%</div><div className="label">Podium %</div></div>
        </div>

        {chartData.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Points Progression</span></div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }} />
                  <Line type="monotone" dataKey="Points" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3, fill: 'var(--accent)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <span className="card-title">Race History</span>
          </div>
          {results.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 16, fontSize: '0.85rem' }}>No results yet</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Race</th><th>Circuit</th><th>Date</th><th>Pos</th><th>Points</th><th>Pole</th><th>FL</th><th>DNF</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r: any) => (
                    <tr key={r.id}>
                      <td><Link to={`/races/${r.race_id}`} style={{ color: 'var(--accent)' }}>{r.race_name}</Link></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r.circuit}</td>
                      <td>{new Date(r.date).toLocaleDateString()}</td>
                      <td><span className={`badge ${r.position === 1 ? 'badge-gold' : r.position <= 3 ? 'badge-green' : ''}`}>{r.position}°</span></td>
                      <td style={{ fontWeight: 600 }}>{r.points}</td>
                      <td>{r.pole_position ? '✓' : '—'}</td>
                      <td>{r.fastest_lap ? '✓' : '—'}</td>
                      <td>{r.dnf ? <span className="badge badge-red">DNF</span> : '—'}</td>
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
