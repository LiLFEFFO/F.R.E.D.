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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
          <h1 className="section-title" style={{ marginBottom: 0 }}>Admin Dashboard</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowNews(true)}>+ News</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ New Series</button>
          </div>
        </div>

        <div className="grid grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card"><div className="value">{dashboard?.championships_count || 0}</div><div className="label">Series</div></div>
          <div className="stat-card"><div className="value">{dashboard?.total_drivers || 0}</div><div className="label">Total Drivers</div></div>
          <div className="stat-card"><div className="value">{dashboard?.total_races || 0}</div><div className="label">Total Races</div></div>
          <div className="stat-card"><div className="value">{dashboard?.total_completed || 0}</div><div className="label">Completed</div></div>
        </div>

        <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 12 }}>Your Series</h2>
        {dashboard?.championships?.length === 0 ? (
          <div className="empty-state">
            <h3>No series yet</h3>
            <p style={{ marginBottom: 12 }}>Create your first series to get started.</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Series</button>
          </div>
        ) : (
          <div className="grid grid-2" style={{ marginBottom: 24 }}>
            {dashboard?.championships?.map((c: any) => (
              <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
                <div>
                  <h3 style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {c.season} · {c.drivers} drivers · {c.completed}/{c.races} races
                    {c.status === 'concluded' && <span className="badge badge-green" style={{ marginLeft: 6 }}>Concluded</span>}
                  </p>
                </div>
                <Link to={`/admin/championships/${c.id}`} className="btn btn-primary btn-sm">Manage</Link>
              </div>
            ))}
          </div>
        )}

        {showCreate && (
          <Modal onClose={() => setShowCreate(false)} title="New Series">
            <input placeholder="Series name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input placeholder="Season" value={form.season} onChange={e => setForm(f => ({ ...f, season: e.target.value }))} />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <textarea placeholder="Regulations" value={form.rules} onChange={e => setForm(f => ({ ...f, rules: e.target.value }))} style={{ minHeight: 100 }} />
            <input type="number" placeholder="Max participants" value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: parseInt(e.target.value) || 30 }))} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createChampionship}>Create</button>
            </div>
          </Modal>
        )}

        {showNews && (
          <Modal onClose={() => setShowNews(false)} title="News Manager" wide>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 8 }}>New Post</h3>
            <input placeholder="Title" value={newsForm.title} onChange={e => setNewsForm(f => ({ ...f, title: e.target.value }))} />
            <textarea placeholder="Content" value={newsForm.content} onChange={e => setNewsForm(f => ({ ...f, content: e.target.value }))} style={{ minHeight: 120 }} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) uploadNewsImage(f); }} />
              {newsForm.cover_image && <span style={{ fontSize: '0.78rem', color: 'var(--accent-green)' }}>✓ Image uploaded</span>}
            </div>
            {newsForm.cover_image && (
              <img src={newsForm.cover_image} alt="preview" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
            )}
            <button className="btn btn-primary" onClick={createNews}>Publish</button>

            {newsList.length > 0 && (
              <>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: 20, marginBottom: 8 }}>Existing Posts</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflow: 'auto' }}>
                  {newsList.map((item: any) => (
                    <div key={item.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.title}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleDateString()} · {item.published ? 'Published' : 'Draft'}</p>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteNews(item.id)}>Delete</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Modal>
        )}
      </div>
    </div>
  );
}

function Modal({ children, onClose, title, wide }: { children: React.ReactNode; onClose: () => void; title: string; wide?: boolean }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width: wide ? 600 : 420, maxWidth: '100%', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{title}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
