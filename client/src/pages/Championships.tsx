import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Championship } from '../types';

export default function Championships() {
  const [active, setActive] = useState<Championship[]>([]);
  const [concluded, setConcluded] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async (s: string) => {
    setLoading(true);
    const [activeData, concludedData] = await Promise.all([
      api.championships.list({ limit: 50, search: s, status: 'active' }),
      api.championships.list({ limit: 50, search: s, status: 'concluded' }),
    ]);
    setActive(activeData.championships);
    setConcluded(concludedData.championships);
    setLoading(false);
  };

  useEffect(() => { load(search); }, []);

  const handleSearch = () => { load(search); };

  function renderCard(c: Championship) {
    return (
      <Link key={c.id} to={`/championships/${c.id}`} style={{ textDecoration: 'none' }}>
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            height: 100, borderRadius: 'var(--radius-sm)', marginBottom: 12,
            background: 'var(--bg-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-muted)'
          }}>{c.name.substring(0, 2).toUpperCase()}</div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>{c.name}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 8, flex: 1 }}>
            {c.description?.substring(0, 100)}{c.description?.length > 100 ? '...' : ''}
          </p>
          <div style={{ display: 'flex', gap: 10, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>{c.driver_count} drivers</span>
            <span>{c.completed_races}/{c.race_count} races</span>
            <span>{c.season}</span>
            {(c as any).status === 'concluded' && <span className="badge badge-green">Concluded</span>}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1 className="section-title">Series</h1>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Search series..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{ maxWidth: 300 }}
          />
          <button onClick={handleSearch} className="btn btn-primary">Search</button>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <>
            <h2 className="section-title" style={{ fontSize: '1.05rem' }}>Active Series</h2>
            {active.length === 0 ? (
              <div className="empty-state" style={{ marginBottom: 32 }}>
                <h3>No active series</h3>
                <p>Check back later or adjust your search.</p>
              </div>
            ) : (
              <div className="grid grid-3" style={{ marginBottom: 40 }}>
                {active.map(renderCard)}
              </div>
            )}

            {concluded.length > 0 && (
              <>
                <h2 className="section-title" style={{ fontSize: '1.05rem' }}>Concluded Series</h2>
                <div className="grid grid-3" style={{ marginBottom: 40 }}>
                  {concluded.map(renderCard)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
