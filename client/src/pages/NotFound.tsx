import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>404</div>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: 8 }}>Page not found</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </div>
    </div>
  );
}
