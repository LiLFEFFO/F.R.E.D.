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
        <div className="container">
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)} style={{ marginBottom: 16 }}>
            ← All news
          </button>
          <div className="card" style={{ maxWidth: 700 }}>
            {selected.cover_image && (
              <img src={selected.cover_image} alt={selected.title}
                style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: 16 }}
                onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
            )}
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6 }}>
              {new Date(selected.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              {selected.author_name && <span> · by {selected.author_name}</span>}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>{selected.title}</h1>
            <div style={{ lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
              {selected.content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1 className="section-title">News</h1>
        {news.length === 0 ? (
          <div className="empty-state">
            <h3>No news yet</h3>
            <p>Check back later for updates.</p>
          </div>
        ) : (
          <div className="card" style={{ maxWidth: 700 }}>
            {news.map((item: any) => (
              <div key={item.id} className="news-card" style={{ cursor: 'pointer' }} onClick={() => setSelected(item)}>
                {item.cover_image && (
                  <img src={item.cover_image} alt={item.title}
                    style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: 10 }}
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
