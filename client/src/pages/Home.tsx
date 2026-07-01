import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Championship } from '../types';

export default function Home() {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.championships.list({ limit: 6, status: 'active' }),
      api.news.list(),
    ]).then(([c, n]) => {
      setChampionships(c.championships);
      setNews(n);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="container">
        <section style={{ padding: '40px 0', textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.03em' }}>
            F.R.E.D.
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.5 }}>
            Framework for Racing Events and Data — A modern platform for managing virtual racing championships.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/championships" className="btn btn-primary btn-lg">Browse Series</Link>
            <Link to="/register" className="btn btn-secondary btn-lg">Get Started</Link>
          </div>
        </section>

        <div className="grid grid-3" style={{ marginBottom: 40 }}>
          <div className="card" style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8, opacity: 0.7 }}>🏁</div>
            <h3 style={{ fontWeight: 600, marginBottom: 4, fontSize: '0.95rem' }}>Championship Management</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Create, manage, and monitor championships with automated scoring and standings.</p>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8, opacity: 0.7 }}>📊</div>
            <h3 style={{ fontWeight: 600, marginBottom: 4, fontSize: '0.95rem' }}>Statistics & Charts</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Interactive charts, driver comparisons, and deep performance analysis.</p>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8, opacity: 0.7 }}>⚡</div>
            <h3 style={{ fontWeight: 600, marginBottom: 4, fontSize: '0.95rem' }}>Real-time Updates</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Standings and scores update instantly after every race result entry.</p>
          </div>
        </div>

        {news.length > 0 && (
          <>
            <h2 className="section-title">Latest News</h2>
            <div className="card" style={{ marginBottom: 32 }}>
              {news.slice(0, 3).map((item: any) => (
                <div key={item.id} className="news-card">
                  <div className="date">{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  <h3>{item.title}</h3>
                  <p>{item.content.substring(0, 200)}{item.content.length > 200 ? '...' : ''}</p>
                </div>
              ))}
              {news.length > 3 && (
                <div style={{ marginTop: 12 }}>
                  <Link to="/news" className="btn btn-ghost btn-sm">All news →</Link>
                </div>
              )}
            </div>
          </>
        )}

        <h2 className="section-title">Featured Series</h2>
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : championships.length === 0 ? (
          <div className="empty-state">
            <h3>No series yet</h3>
            <p>Series will appear here once created.</p>
          </div>
        ) : (
          <div className="grid grid-3">
            {championships.map(c => (
              <Link key={c.id} to={`/championships/${c.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    height: 100, borderRadius: 'var(--radius-sm)', marginBottom: 12,
                    background: 'var(--bg-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-muted)',
                    letterSpacing: '-0.02em'
                  }}>{c.name.substring(0, 2).toUpperCase()}</div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>{c.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 8, flex: 1 }}>
                    {c.description?.substring(0, 100)}{c.description?.length > 100 ? '...' : ''}
                  </p>
                  <div style={{ display: 'flex', gap: 10, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>{c.driver_count} drivers</span>
                    <span>{c.completed_races}/{c.race_count} races</span>
                    <span>{c.season}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {championships.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to="/championships" className="btn btn-secondary">All Series</Link>
          </div>
        )}
      </div>
    </div>
  );
}
