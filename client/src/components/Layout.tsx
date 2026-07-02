import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="container">
          <span className="footer-brand">F.R.E.D.</span>
          <span className="footer-copy">&copy; {new Date().getFullYear()} &mdash; Framework for Racing Events and Data</span>
        </div>
      </footer>

      <style>{`
        .site-footer {
          background: var(--bg-card);
          border-top: 1px solid var(--border);
          padding: 20px 0;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.8rem;
        }
        .site-footer .container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .footer-brand {
          font-weight: 700;
          color: var(--text);
        }
        .footer-copy { color: var(--text-muted); }
      `}</style>
    </div>
  );
}
