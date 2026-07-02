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
      <section className="hero">
        <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div className="hero-badge">Beta v1.0</div>
          <h1 className="hero-title">
            F.R.E.D.
          </h1>
          <p className="hero-subtitle">
            Framework for Racing Events and Data
          </p>
          <p className="hero-desc">
            A modern platform for managing virtual racing championships. Track standings, analyze performance, and compete at the highest level.
          </p>
          <div className="hero-actions">
            <Link to="/championships" className="btn btn-primary btn-xl">Browse Series</Link>
            <Link to="/register" className="btn btn-secondary btn-xl">Get Started</Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">{championships.length}+</span>
              <span className="hero-stat-label">Active Series</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">{championships.reduce((a, c) => a + (c.driver_count || 0), 0)}+</span>
              <span className="hero-stat-label">Drivers</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">{championships.reduce((a, c) => a + (c.completed_races || 0), 0)}+</span>
              <span className="hero-stat-label">Races</span>
            </div>
          </div>
        </div>
        <div className="hero-bg" />
      </section>

      <div className="container">
        <div className="features-grid">
          <div className="feature-card slide-up stagger-1">
            <div className="feature-icon" style={{ background: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <h3>Championship Management</h3>
            <p>Create and manage racing series with automated scoring, standings, and real-time race result tracking.</p>
          </div>
          <div className="feature-card slide-up stagger-2">
            <div className="feature-icon" style={{ background: 'var(--accent-green-light)', color: 'var(--accent-green)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
            <h3>Statistics & Charts</h3>
            <p>Interactive performance charts, driver comparisons, and deep analytics to uncover every insight.</p>
          </div>
          <div className="feature-card slide-up stagger-3">
            <div className="feature-icon" style={{ background: 'var(--accent-purple)', color: '#fff' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <h3>Real-time Updates</h3>
            <p>Standings and scores update instantly after every race result, keeping you always in the loop.</p>
          </div>
        </div>

        {news.length > 0 && (
          <section className="section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Latest News</h2>
              {news.length > 3 && <Link to="/news" className="btn btn-ghost btn-sm">All news →</Link>}
            </div>
            <div className="card">
              {news.slice(0, 3).map((item: any, i: number) => (
                <div key={item.id} className="news-card fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="date">{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  <h3>{item.title}</h3>
                  <p>{item.content.substring(0, 200)}{item.content.length > 200 ? '...' : ''}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Featured Series</h2>
            {championships.length > 0 && <Link to="/championships" className="btn btn-ghost btn-sm">All Series →</Link>}
          </div>
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : championships.length === 0 ? (
            <div className="empty-state">
              <h3>No series yet</h3>
              <p>Series will appear here once created.</p>
            </div>
          ) : (
            <div className="grid grid-auto">
              {championships.map((c, i) => {
                const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                const color = colors[i % colors.length];
                return (
                  <Link key={c.id} to={`/championships/${c.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card card-interactive fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
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
        .hero {
          position: relative;
          padding: 80px 0 60px;
          overflow: hidden;
        }
        .hero-badge {
          display: inline-flex;
          padding: 4px 14px;
          border-radius: 100px;
          font-size: 0.78rem;
          font-weight: 600;
          background: var(--accent-light);
          color: var(--accent);
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .hero-title {
          font-size: clamp(2.8rem, 6vw, 4.5rem);
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: -0.04em;
          background: linear-gradient(135deg, var(--accent), #7c3aed, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-subtitle {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 8px;
        }
        .hero-desc {
          font-size: 1rem;
          color: var(--text-secondary);
          max-width: 520px;
          margin: 0 auto 28px;
          line-height: 1.7;
        }
        .hero-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 48px;
        }
        .hero-stats {
          display: flex;
          gap: 40px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .hero-stat-value {
          display: block;
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.03em;
        }
        .hero-stat-label {
          font-size: 0.78rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 500;
        }
        .hero-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(ellipse at 50% 0%, var(--accent-light) 0%, transparent 60%);
          opacity: 0.6;
          pointer-events: none;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 48px;
        }
        .feature-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 28px;
          transition: all var(--transition-slow);
          box-shadow: var(--shadow);
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: var(--accent);
        }
        .feature-icon {
          width: 48px; height: 48px;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .feature-card h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--text);
        }
        .feature-card p {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .section { margin-bottom: 48px; }
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
          letter-spacing: -0.02em;
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
        @media (max-width: 900px) {
          .features-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .hero { padding: 48px 0 40px; }
          .features-grid { grid-template-columns: 1fr; }
          .hero-stats { gap: 24px; }
          .hero-stat-value { font-size: 1.3rem; }
        }
      `}</style>
    </div>
  );
}
