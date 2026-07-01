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
      <footer style={{
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        padding: '16px 0',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.8rem'
      }}>
        <div className="container">
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>F.R.E.D.</span> &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
