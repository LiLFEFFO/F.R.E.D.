import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#2563eb', '#ea580c', '#dc2626', '#16a34a', '#ca8a04', '#0891b2', '#7c3aed', '#db2777'];

export default function Statistics() {
  const { id } = useParams<{ id: string }>();
  const [champ, setChamp] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.championships.get(id),
      api.championships.statistics(id),
    ]).then(([c, s]) => {
      setChamp(c);
      setStats(s);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><div className="loading"><div className="spinner" /></div></div>;
  if (!champ) return <div className="page"><div className="empty-state"><h3>Not found</h3></div></div>;

  const drivers = stats?.drivers || [];
  const pointsData = drivers.map((d: any) => ({ name: d.name.substring(0, 12), Points: d.points }));

  return (
    <div className="page">
      <div className="container">
        <Link to={`/championships/${champ.id}`} style={{ color: 'var(--text-secondary)', marginBottom: 12, display: 'inline-block', fontSize: '0.85rem' }}>
          ← Back to {champ.name}
        </Link>
        <h1 className="section-title">Statistics — {champ.name}</h1>

        <div className="grid grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card"><div className="value">{drivers.length}</div><div className="label">Drivers</div></div>
          <div className="stat-card"><div className="value">{drivers.reduce((s: number, d: any) => s + d.wins, 0)}</div><div className="label">Total Wins</div></div>
          <div className="stat-card"><div className="value">{drivers.reduce((s: number, d: any) => s + d.podiums, 0)}</div><div className="label">Total Podiums</div></div>
          <div className="stat-card"><div className="value">{drivers.reduce((s: number, d: any) => s + d.poles, 0)}</div><div className="label">Pole Positions</div></div>
        </div>

        <div className="grid grid-2" style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Points</span></div>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={pointsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} angle={-20} textAnchor="end" height={50} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }} />
                  <Bar dataKey="Points" fill="var(--accent)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Wins & Podiums</span></div>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={drivers.slice(0, 10).map((d: any) => ({ name: d.name.substring(0, 12), Wins: d.wins, Podiums: d.podiums }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} angle={-20} textAnchor="end" height={50} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
                  <Bar dataKey="Wins" fill="#ca8a04" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Podiums" fill="#ea580c" radius={[3, 3, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Driver Details</span></div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Driver</th><th>Team</th><th>Points</th><th>Wins</th><th>Podiums</th><th>Poles</th><th>FL</th><th>Races</th><th>Avg</th><th>% Podium</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d: any) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>#{d.position}</td>
                    <td><Link to={`/drivers/${d.id}`} style={{ color: 'var(--text)', fontWeight: 500 }}>{d.name}</Link></td>
                    <td><span style={{ color: d.team_color }}>■</span> {d.team_name}</td>
                    <td style={{ fontWeight: 700 }}>{d.points}</td>
                    <td>{d.wins}</td>
                    <td>{d.podiums}</td>
                    <td>{d.poles}</td>
                    <td>{d.fastest_laps}</td>
                    <td>{d.races_done}</td>
                    <td>{d.avg_points}</td>
                    <td>{d.podium_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
