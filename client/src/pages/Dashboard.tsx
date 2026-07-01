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

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Welcome, {user.username}</p>
          </div>
          <span className={`badge ${user.role === 'elite' ? 'badge-gold' : 'badge-blue'}`}>
            {user.role === 'elite' ? 'ELITE' : 'Standard'}
          </span>
        </div>

        <EliteRequestCard />

        {myChamps.length > 0 && (
          <>
            <h2 className="section-title">Your Series</h2>
            <div className="grid grid-2" style={{ marginBottom: 32 }}>
              {myChamps.map(c => {
                const s = myStandings[c.id];
                return (
                  <Link key={c.id} to={`/championships/${c.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 16 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: 'var(--bg-secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', flexShrink: 0
                      }}>#{s.position}</div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 600, marginBottom: 2, color: 'var(--text)', fontSize: '0.95rem' }}>{c.name}</h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {s.points} pts · {s.wins} wins · {s.races_done} races
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {user.role === 'elite' && (
          <>
            <h2 className="section-title">Your Series (Organizer)</h2>
            {(() => {
              const organized = championships.filter(c => c.created_by === user.id);
              if (organized.length === 0) {
                return (
                  <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: '0.9rem' }}>You haven't created any series yet.</p>
                    <Link to="/admin" className="btn btn-primary">Create your first series</Link>
                  </div>
                );
              }
              return (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    <Link to="/admin" className="btn btn-primary btn-sm">Manage Series</Link>
                  </div>
                  <div className="grid grid-2">
                    {organized.map(c => (
                      <Link key={c.id} to={`/admin/championships/${c.id}`} style={{ textDecoration: 'none' }}>
                        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
                          <div>
                            <h3 style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem' }}>{c.name}</h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{c.season}</p>
                          </div>
                          <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            <div>{c.driver_count} drivers</div>
                            <div>{c.completed_races}/{c.race_count} races</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        )}

        <h2 className="section-title">All Series</h2>
        <div className="grid grid-3">
          {championships.map(c => (
            <Link key={c.id} to={`/championships/${c.id}`} style={{ textDecoration: 'none' }}>
              <div className="card">
                <div style={{
                  height: 80, borderRadius: 'var(--radius-sm)', marginBottom: 10,
                  background: 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '1.3rem', color: 'var(--text-muted)'
                }}>{c.name.substring(0, 2).toUpperCase()}</div>
                <h3 style={{ fontWeight: 600, marginBottom: 2, color: 'var(--text)', fontSize: '0.9rem' }}>{c.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{c.season} · {c.organizer_name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
