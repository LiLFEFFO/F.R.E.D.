import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#4f46e5', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

export default function Statistics() {
  const { id } = useParams<{ id: string }>();
  const [champ, setChamp] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try { setChamp(await api.championships.get(id)); } catch {}
      try { setStats(await api.championships.statistics(id)); } catch {}
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="page"><div className="loading"><div className="spinner" /></div></div>;
  if (!champ) return <div className="page"><div className="empty-state"><h3>Not found</h3></div></div>;

  const drivers = stats?.drivers || [];
  const pointsData = drivers.map((d: any) => ({ name: d.name.substring(0, 12), Points: d.points }));

  return (
    <div className="page">
      <div className="container">
        <Link to={`/championships/${champ.id}`} className="btn btn-ghost btn-sm mb-4" style={{ display: 'inline-flex' }}>
          ← Back to {champ.name}
        </Link>

        <h1 className="section-title">Statistics — {champ.name}</h1>

        <div className="grid grid-4 mb-6">
          <div className="stat-card">
            <span className="stat-icon">👥</span>
            <div className="value">{drivers.length}</div>
            <div className="label">Drivers</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🏆</span>
            <div className="value">{drivers.reduce((s: number, d: any) => s + d.wins, 0)}</div>
            <div className="label">Total Wins</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🥇</span>
            <div className="value">{drivers.reduce((s: number, d: any) => s + d.podiums, 0)}</div>
            <div className="label">Total Podiums</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🎯</span>
            <div className="value">{drivers.reduce((s: number, d: any) => s + d.poles, 0)}</div>
            <div className="label">Pole Positions</div>
          </div>
        </div>

        <div className="grid grid-2 mb-6">
          <div className="card">
            <div className="card-header"><span className="card-title">Points</span></div>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={pointsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} angle={-20} textAnchor="end" height={50} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }} />
                  <Bar dataKey="Points" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Wins & Podiums</span></div>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={drivers.slice(0, 10).map((d: any) => ({ name: d.name.substring(0, 12), Wins: d.wins, Podiums: d.podiums }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} angle={-20} textAnchor="end" height={50} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
                  <Bar dataKey="Wins" fill="var(--accent-gold)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="Podiums" fill="var(--accent-orange)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Driver Details</span></div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Driver</th><th>Team</th><th>Points</th><th>Wins</th><th>Podiums</th><th>Poles</th><th>FL</th><th>Races</th><th>Avg</th><th>% Podium</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d: any) => (
                  <tr key={d.id}>
                    <td className="font-bold">#{d.position}</td>
                    <td><Link to={`/drivers/${d.id}`} style={{ color: 'var(--text)', fontWeight: 500 }}>{d.name}</Link></td>
                    <td><span className="team-dot" style={{ background: d.team_color }} /> {d.team_name}</td>
                    <td className="font-bold text-accent">{d.points}</td>
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

      <style>{`
        .team-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
      `}</style>
    </div>
  );
}
