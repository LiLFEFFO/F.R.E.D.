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

  const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  function renderCard(c: Championship, i: number) {
    const color = colors[i % colors.length];
    return (
      <Link key={c.id} to={`/championships/${c.id}`} style={{ textDecoration: 'none' }}>
        <div className="card card-interactive fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', animationDelay: `${i * 0.04}s` }}>
          <div className="champ-card-header" style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}>
            <span>{c.name.substring(0, 2).toUpperCase()}</span>
          </div>
          <h3 className="champ-card-title">{c.name}</h3>
          <p className="champ-card-desc" style={{ flex: 1 }}>
            {c.description?.substring(0, 120)}{c.description?.length > 120 ? '...' : ''}
          </p>
          <div className="champ-card-meta">
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
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="section-title" style={{ marginBottom: 4 }}>Series</h1>
            <p className="text-sm text-secondary">Browse all racing championships</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search series..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ width: 220 }}
            />
            <button onClick={handleSearch} className="btn btn-primary">Search</button>
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="section-title" style={{ fontSize: '1.1rem' }}>Active Series</h2>
              {active.length === 0 ? (
                <div className="empty-state">
                  <h3>No active series</h3>
                  <p>Check back later or adjust your search.</p>
                </div>
              ) : (
                <div className="grid grid-auto">
                  {active.map((c, i) => renderCard(c, i))}
                </div>
              )}
            </section>

            {concluded.length > 0 && (
              <section>
                <h2 className="section-title" style={{ fontSize: '1.1rem' }}>Concluded Series</h2>
                <div className="grid grid-auto">
                  {concluded.map((c, i) => renderCard(c, i))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <style>{`
        .champ-card-header {
          height: 100px;
          border-radius: var(--radius-sm);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.6rem;
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
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .champ-card-meta {
          display: flex;
          gap: 12px;
          font-size: 0.75rem;
          color: var(--text-muted);
          flex-wrap: wrap;
        }
        @media (max-width: 600px) {
          .champ-card-header { height: 80px; font-size: 1.3rem; }
        }
      `}</style>
    </div>
  );
}
