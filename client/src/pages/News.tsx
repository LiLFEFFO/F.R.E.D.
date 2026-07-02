import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function News() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    api.news.list()
      .then(setNews)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="loading"><div className="spinner" /></div></div>;

  if (selected) {
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: 760, margin: '0 auto' }}>
          <button className="btn btn-ghost btn-sm mb-4" onClick={() => setSelected(null)}>
            ← All news
          </button>
          <article className="card fade-in" style={{ padding: 32 }}>
            {selected.cover_image && (
              <img src={selected.cover_image} alt={selected.title}
                style={{ width: '100%', height: 280, objectFit: 'cover', borderRadius: 'var(--radius)', marginBottom: 24 }}
                onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
            )}
            <div className="text-xs text-muted mb-2">
              {new Date(selected.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              {selected.author_name && <span> · by {selected.author_name}</span>}
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 20, letterSpacing: '-0.02em' }}>{selected.title}</h1>
            <div className="news-content">
              {selected.content}
            </div>
          </article>
        </div>
        <style>{`
          .news-content { line-height: 1.8; color: var(--text-secondary); font-size: 0.95rem; white-space: pre-wrap; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 className="section-title">News</h1>
        {news.length === 0 ? (
          <div className="empty-state">
            <h3>No news yet</h3>
            <p>Check back later for updates.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 8 }}>
            {news.map((item: any, i: number) => (
              <div key={item.id} className="news-card fade-in" style={{ cursor: 'pointer', padding: '16px 16px', animationDelay: `${i * 0.04}s` }} onClick={() => setSelected(item)}>
                {item.cover_image && (
                  <img src={item.cover_image} alt={item.title}
                    style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: 12 }}
                    onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                )}
                <div className="date">
                  {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {item.author_name && <span> · {item.author_name}</span>}
                </div>
                <h3>{item.title}</h3>
                <p>{item.content.substring(0, 200)}{item.content.length > 200 ? '...' : ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
