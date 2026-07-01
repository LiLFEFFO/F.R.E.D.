import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import NotificationBell from './NotificationBell';

const navLinks = [
  { path: '/', label: 'Home', icon: '◇' },
  { path: '/news', label: 'News', icon: '○' },
  { path: '/championships', label: 'Series', icon: '◆' },
  { path: '/compare', label: 'Compare', icon: '⇄' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();

  return (
    <nav style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: 56
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: '100%', gap: 24 }}>
        <Link to="/" style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap'
        }}>
          F.R.E.D.
        </Link>

        <div style={{ display: 'flex', gap: 2, flex: 1 }}>
          {navLinks.map(link => (
            <Link key={link.path} to={link.path}
              className="btn btn-ghost btn-sm"
              style={{
                color: location.pathname === link.path ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: location.pathname === link.path ? 600 : 400,
              }}>
              {link.label}
            </Link>
          ))}
          {user?.role === 'elite' && (
            <Link to="/admin" className="btn btn-ghost btn-sm"
              style={{
                color: location.pathname.startsWith('/admin') ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: location.pathname.startsWith('/admin') ? 600 : 400,
              }}>
              Admin
            </Link>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={toggle} className="btn btn-ghost btn-sm" title="Toggle theme">
            {theme === 'dark' ? '☀' : '☾'}
          </button>

          {user ? (
            <>
              <NotificationBell />
              <Link to="/dashboard" className="btn btn-ghost btn-sm" style={{ fontWeight: 500 }}>
                {user.username}
              </Link>
              <button onClick={logout} className="btn btn-ghost btn-sm">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
