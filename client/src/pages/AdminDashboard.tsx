import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const data = await api.admin.dashboard();
      setDashboard(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', season: '2026', description: '', rules: '', max_participants: 30 });
  const [showNews, setShowNews] = useState(false);
  const [newsForm, setNewsForm] = useState({ title: '', content: '', cover_image: '' });
  const [newsList, setNewsList] = useState<any[]>([]);

  const createChampionship = async () => {
    if (!form.name) return;
    await api.championships.create(form);
    setShowCreate(false);
    setForm({ name: '', season: '2026', description: '', rules: '', max_participants: 30 });
    load();
  };

  const uploadNewsImage = async (file: File) => {
    try {
      const { url } = await api.upload(file);
      setNewsForm(f => ({ ...f, cover_image: url }));
    } catch {}
  };

  const createNews = async () => {
    if (!newsForm.title || !newsForm.content) return;
    await api.news.create(newsForm);
    setShowNews(false);
    setNewsForm({ title: '', content: '', cover_image: '' });
    const news = await api.news.listAll();
    setNewsList(news);
  };

  const deleteNews = async (id: string) => {
    if (confirm('Delete this news item?')) {
      await api.news.delete(id);
      setNewsList(l => l.filter(x => x.id !== id));
    }
  };

  useEffect(() => {
    if (showNews) api.news.listAll().then(setNewsList).catch(() => {});
  }, [showNews]);

  if (loading) return <div className="page"><div className="loading"><div className="spinner" /></div></div>;

  return (
    <div className="page">
      <div className="container">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="section-title" style={{ marginBottom: 4 }}>Admin Dashboard</h1>
            <p className="text-sm text-secondary">Manage series, races, and content</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => setShowNews(true)}>+ News</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ New Series</button>
          </div>
        </div>

        <div className="grid grid-4 mb-6">
          <div className="stat-card">
            <span className="stat-icon">🏁</span>
            <div className="value">{dashboard?.championships_count || 0}</div>
            <div className="label">Series</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">👥</span>
            <div className="value">{dashboard?.total_drivers || 0}</div>
            <div className="label">Total Drivers</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🏎️</span>
            <div className="value">{dashboard?.total_races || 0}</div>
            <div className="label">Total Races</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <div className="value">{dashboard?.total_completed || 0}</div>
            <div className="label">Completed</div>
          </div>
        </div>

        <h2 className="section-title" style={{ fontSize: '1.1rem' }}>Your Series</h2>
        {dashboard?.championships?.length === 0 ? (
          <div className="card text-center" style={{ padding: 40 }}>
            <p className="text-secondary mb-4">No series yet. Create your first series to get started.</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Series</button>
          </div>
        ) : (
          <div className="grid grid-auto-sm mb-6">
            {dashboard?.championships?.map((c: any, i: number) => {
              const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];
              const color = colors[i % colors.length];
              return (
                <div key={c.id} className="card" style={{ padding: 16 }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="avatar avatar-sm" style={{ background: `linear-gradient(135deg, ${color}, ${color}88)`, color: '#fff' }}>
                        {c.name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{c.name}</h3>
                        <p className="text-xs text-muted">{c.season} · {c.drivers} drivers</p>
                      </div>
                    </div>
                    {c.status === 'concluded' && <span className="badge badge-green text-xs">Concluded</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted">{c.completed}/{c.races} races</p>
                    <Link to={`/admin/championships/${c.id}`} className="btn btn-primary btn-sm">Manage</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showCreate && (
          <Modal onClose={() => setShowCreate(false)} title="New Series">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Series name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <input placeholder="Season" value={form.season} onChange={e => setForm(f => ({ ...f, season: e.target.value }))} />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <textarea placeholder="Regulations" value={form.rules} onChange={e => setForm(f => ({ ...f, rules: e.target.value }))} style={{ minHeight: 100 }} />
              <input type="number" placeholder="Max participants" value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: parseInt(e.target.value) || 30 }))} />
              <div className="flex justify-between" style={{ gap: 8, marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={createChampionship}>Create</button>
              </div>
            </div>
          </Modal>
        )}

        {showNews && (
          <Modal onClose={() => setShowNews(false)} title="News Manager" wide>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 className="font-semibold text-sm">New Post</h3>
              <input placeholder="Title" value={newsForm.title} onChange={e => setNewsForm(f => ({ ...f, title: e.target.value }))} />
              <textarea placeholder="Content" value={newsForm.content} onChange={e => setNewsForm(f => ({ ...f, content: e.target.value }))} style={{ minHeight: 120 }} />
              <div className="flex items-center gap-3">
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) uploadNewsImage(f); }} />
                {newsForm.cover_image && <span className="badge badge-green">Image uploaded</span>}
              </div>
              {newsForm.cover_image && (
                <img src={newsForm.cover_image} alt="preview" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
              )}
              <button className="btn btn-primary" onClick={createNews}>Publish</button>

              {newsList.length > 0 && (
                <>
                  <h3 className="font-semibold text-sm mt-4">Existing Posts</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflow: 'auto' }}>
                    {newsList.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 10 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p className="font-semibold text-sm truncate">{item.title}</p>
                          <p className="text-xs text-muted">{new Date(item.created_at).toLocaleDateString()} · {item.published ? 'Published' : 'Draft'}</p>
                        </div>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteNews(item.id)}>Delete</button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}

function Modal({ children, onClose, title, wide }: { children: React.ReactNode; onClose: () => void; title: string; wide?: boolean }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ width: wide ? 560 : 420 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {children}
      </div>
      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 20px;
        }
        .modal-content {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 24px;
          max-width: 100%; max-height: 85vh; overflow: auto;
          box-shadow: var(--shadow-xl);
        }
      `}</style>
    </div>
  );
}
