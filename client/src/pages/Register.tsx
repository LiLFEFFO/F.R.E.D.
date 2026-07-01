import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(username, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)' }}>
      <div className="card" style={{ width: 380, maxWidth: '90vw' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>Create your account</h2>
        {error && (
          <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 'var(--radius-sm)', padding: 10, marginBottom: 16, color: 'var(--accent-red)', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Your username" required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
            Sign up
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
