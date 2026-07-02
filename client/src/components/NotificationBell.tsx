import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Notification as Notif } from '../types';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const data = await api.notifications.list();
      setNotifications(data.notifications);
      setUnread(data.unread_count);
    } catch {}
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAll = async () => {
    await api.notifications.markAllRead();
    setUnread(0);
    setNotifications(n => n.map(x => ({ ...x, read: true })));
  };

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="btn btn-icon btn-ghost" onClick={() => setOpen(!open)} style={{ position: 'relative' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <strong className="text-sm">Notifications</strong>
            {unread > 0 && <button onClick={markAll} className="btn btn-ghost btn-sm">Mark all read</button>}
          </div>
          {notifications.length === 0 ? (
            <div className="notif-empty">No notifications</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}
                onClick={async () => {
                  if (!n.read) { await api.notifications.markRead(n.id); load(); }
                }}>
                <span className="notif-icon">
                  {n.type === 'result' ? '🏁' : n.type === 'update' ? '📋' : 'ℹ'}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p className="notif-message">{n.message}</p>
                  <p className="notif-date">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <style>{`
        .notif-badge {
          position: absolute; top: 2px; right: 2px;
          background: var(--accent-red); color: #fff;
          font-size: 0.55rem; font-weight: 700;
          min-width: 16px; height: 16px;
          border-radius: 50%; display: flex;
          align-items: center; justify-content: center;
          padding: 0 3px; line-height: 1;
          box-shadow: 0 0 0 2px var(--bg-card);
        }
        .notif-dropdown {
          position: absolute; right: 0; top: 100%; margin-top: 8px;
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius); box-shadow: var(--shadow-lg);
          width: 320px; max-height: 380px; overflow: auto; z-index: 200;
        }
        .notif-header {
          padding: 12px 14px; border-bottom: 1px solid var(--border);
          display: flex; justify-content: space-between; align-items: center;
          position: sticky; top: 0; background: var(--bg-card); z-index: 1;
        }
        .notif-empty { padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem; }
        .notif-item {
          display: flex; gap: 10px; align-items: flex-start;
          padding: 10px 14px; border-bottom: 1px solid var(--border-light);
          cursor: pointer; font-size: 0.85rem; transition: background var(--transition);
        }
        .notif-item:hover { background: var(--bg-hover); }
        .notif-item.unread { background: var(--accent-light); }
        .notif-icon { font-size: 1rem; line-height: 1.3; }
        .notif-message { color: var(--text); line-height: 1.4; }
        .notif-date { color: var(--text-muted); font-size: 0.72rem; margin-top: 2px; }
      `}</style>
    </div>
  );
}
