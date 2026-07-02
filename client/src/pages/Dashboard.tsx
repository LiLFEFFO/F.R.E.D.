import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import EliteRequestCard from '../components/EliteRequestCard';

export default function Dashboard() {
  const { user } = useAuth();
  const [championships, setChampionships] = useState<any[]>([]);
  const [myStandings, setMyStandings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.championships.list({ limit: 50 }),
    ]).then(([champData]) => {
      const allChamps = champData.championships;
      setChampionships(allChamps);
      return Promise.all(
        allChamps.map((c: any) =>
          api.championships.standings(c.id).then(s => ({ id: c.id, standings: s }))
        )
      );
    }).then(standingsData => {
      const map: Record<string, any> = {};
      for (const s of standingsData) {
        const driverStanding = s.standings.driver_standings?.find(
          (ds: any) => ds.driver_name?.toLowerCase().includes(user!.username.toLowerCase())
        );
        if (driverStanding) map[s.id] = driverStanding;
      }
      setMyStandings(map);
    }).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;
  if (loading) return <div className="page"><div className="loading"><div className="spinner" /></div></div>;

  const myChamps = championships.filter(c => myStandings[c.id]);
  const organized = user.role === 'elite' ? championships.filter(c => c.created_by === user.id) : [];

  return (
    <div className="page">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-greeting">Welcome back, {user.username}</h1>
            <p className="text-secondary text-sm">Here's what's happening in your series.</p>
          </div>
          <span className={`badge ${user.role === 'elite' ? 'badge-gold' : 'badge-blue'}`}>
            {user.role === 'elite' ? 'Elite' : 'Standard'}
          </span>
        </div>

        <EliteRequestCard />

        {myChamps.length > 0 && (
          <section className="mb-6">
            <h2 className="section-title">Your Series</h2>
            <div className="grid grid-auto-sm">
              {myChamps.map(c => {
                const s = myStandings[c.id];
                const posColor = s.position <= 3 ? 'var(--accent-gold)' : 'var(--text)';
                return (
                  <Link key={c.id} to={`/championships/${c.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card card-interactive" style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 18 }}>
                      <div className={`avatar avatar-lg ${s.position <= 3 ? 'badge-gold' : ''}`}
                        style={{
                          background: s.position <= 3 ? 'var(--accent-gold-light)' : 'var(--bg-secondary)',
                          color: posColor,
                          fontWeight: 800,
                          fontSize: '1.2rem'
                        }}>
                        #{s.position}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="font-semibold truncate" style={{ fontSize: '0.95rem', marginBottom: 4, color: 'var(--text)' }}>{c.name}</h3>
                        <div className="text-xs text-muted">
                          {s.points} pts · {s.wins} win{s.wins !== 1 ? 's' : ''} · {s.races_done} race{s.races_done !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {user.role === 'elite' && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="section-title" style={{ marginBottom: 0 }}>Organized Series</h2>
              <Link to="/admin" className="btn btn-primary btn-sm">Create Series</Link>
            </div>
            {organized.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <p className="text-secondary text-sm mb-4">You haven't created any series yet.</p>
                <Link to="/admin" className="btn btn-primary">Create your first series</Link>
              </div>
            ) : (
              <div className="grid grid-auto-sm">
                {organized.map(c => (
                  <Link key={c.id} to={`/admin/championships/${c.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card card-interactive" style={{ padding: 18 }}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold" style={{ fontSize: '0.95rem', color: 'var(--text)' }}>{c.name}</h3>
                        <span className="badge badge-blue">{c.season}</span>
                      </div>
                      <div className="flex gap-4 text-xs text-muted">
                        <span>{c.driver_count} drivers</span>
                        <span>{c.completed_races}/{c.race_count} races</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        <section>
          <h2 className="section-title">All Series</h2>
          {championships.length === 0 ? (
            <div className="empty-state">
              <h3>No series available</h3>
              <p>Series will appear here once created.</p>
            </div>
          ) : (
            <div className="grid grid-auto">
              {championships.map((c, i) => {
                const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                const color = colors[i % colors.length];
                return (
                  <Link key={c.id} to={`/championships/${c.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card card-interactive fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                      <div className="champ-card-header" style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}>
                        <span>{c.name.substring(0, 2).toUpperCase()}</span>
                      </div>
                      <h3 className="champ-card-title">{c.name}</h3>
                      <p className="champ-card-desc">
                        {c.description?.substring(0, 100)}{c.description?.length > 100 ? '...' : ''}
                      </p>
                      <div className="champ-card-meta">
                        <span>{c.driver_count} drivers</span>
                        <span>{c.completed_races}/{c.race_count} races</span>
                        <span>{c.season}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <style>{`
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .dashboard-greeting {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .champ-card-header {
          height: 90px;
          border-radius: var(--radius-sm);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.5rem;
          color: #fff;
        }
        .champ-card-title {
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 6px;
          color: var(--text);
        }
        .champ-card-desc {
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin-bottom: 10px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .champ-card-meta {
          display: flex;
          gap: 12px;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        @media (max-width: 600px) {
          .dashboard-greeting { font-size: 1.25rem; }
        }
      `}</style>
    </div>
  );
}
