import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import NotificationBell from './NotificationBell';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/news', label: 'News' },
  { path: '/championships', label: 'Series' },
  { path: '/compare', label: 'Compare' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLink = () => setOpen(false);

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" onClick={handleLink} className="navbar-brand">
          <span className="navbar-logo">F</span>
        </Link>

        <div className="nav-links">
          {navLinks.map(link => (
            <Link key={link.path} to={link.path}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}>
              {link.label}
            </Link>
          ))}
          {user?.role === 'elite' && (
            <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
              Admin
            </Link>
          )}
        </div>

        <div className="nav-actions">
          <button onClick={toggle} className="btn btn-icon btn-ghost" title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>

          {user ? (
            <>
              <NotificationBell />
              <Link to="/dashboard" className="btn btn-ghost btn-sm nav-user">{user.username}</Link>
              <button onClick={logout} className="btn btn-ghost btn-sm nav-auth-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm nav-auth-btn">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm nav-signup">Sign up</Link>
            </>
          )}

          <button className="btn btn-icon btn-ghost navbar-toggle" onClick={() => setOpen(!open)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {open ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="mobile-menu">
          {navLinks.map(link => (
            <Link key={link.path} to={link.path} onClick={handleLink}
              className={`mobile-link ${isActive(link.path) ? 'active' : ''}`}>
              {link.label}
            </Link>
          ))}
          {user?.role === 'elite' && (
            <Link to="/admin" onClick={handleLink}
              className={`mobile-link ${isActive('/admin') ? 'active' : ''}`}>
              Admin
            </Link>
          )}
          {user ? (
            <div className="mobile-auth">
              <Link to="/dashboard" className="mobile-link" onClick={handleLink}>Dashboard</Link>
              <button onClick={() => { logout(); setOpen(false); }} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 12px', fontSize: '0.9rem' }}>Logout</button>
            </div>
          ) : (
            <div className="mobile-auth">
              <Link to="/login" className="mobile-link" onClick={handleLink}>Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ margin: '8px 12px', textAlign: 'center', display: 'block' }} onClick={handleLink}>Sign up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
