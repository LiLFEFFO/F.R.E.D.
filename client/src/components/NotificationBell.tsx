import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Notification as Notif } from '../types';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try {
      const data = await api.notifications.list();
      setNotifications(data.notifications);
      setUnread(data.unread_count);
    } catch {}
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const markAll = async () => {
    await api.notifications.markAllRead();
    setUnread(0);
    setNotifications(n => n.map(x => ({ ...x, read: true })));
  };

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(!open)} style={{ position: 'relative' }}>
        {unread > 0 ? '🔔' : '🔕'}
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: 'var(--accent-red)', color: '#fff',
            fontSize: '0.6rem', fontWeight: 700,
            width: 15, height: 15, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>{unread}</span>
        )}
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 6,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)',
          width: 300, maxHeight: 360, overflow: 'auto', zIndex: 200
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.85rem' }}>Notifications</strong>
            {unread > 0 && <button onClick={markAll} className="btn btn-ghost btn-sm">Mark all read</button>}
          </div>
          {notifications.length === 0 ? (
            <div className="empty-state" style={{ padding: 20 }}>
              <p style={{ fontSize: '0.85rem' }}>No notifications</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} style={{
                padding: '8px 12px', borderBottom: '1px solid var(--border)',
                background: n.read ? 'transparent' : 'rgba(37,99,235,0.04)',
                cursor: 'pointer', fontSize: '0.82rem'
              }} onClick={async () => {
                if (!n.read) { await api.notifications.markRead(n.id); load(); }
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span>{n.type === 'result' ? '🏁' : n.type === 'update' ? '📋' : 'ℹ'}</span>
                  <div>
                    <p style={{ color: 'var(--text)' }}>{n.message}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
