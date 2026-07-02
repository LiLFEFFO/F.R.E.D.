import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - var(--nav-height))' }}>
      <div className="text-center">
        <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.04em', marginBottom: 8 }}>404</h1>
        <p className="text-lg text-secondary mb-6">Page not found</p>
        <Link to="/" className="btn btn-primary">Go Home</Link>
      </div>
    </div>
  );
}
