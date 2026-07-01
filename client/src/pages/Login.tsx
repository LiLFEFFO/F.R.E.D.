import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)' }}>
      <div className="card" style={{ width: 380, maxWidth: '90vw' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>Sign in to F.R.E.D.</h2>
        {error && (
          <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 'var(--radius-sm)', padding: 10, marginBottom: 16, color: 'var(--accent-red)', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
            Sign in
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          No account? <Link to="/register" style={{ color: 'var(--accent)' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
