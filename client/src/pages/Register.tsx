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
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - var(--nav-height))' }}>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">F</div>
          <h2>Create your account</h2>
          <p className="text-sm text-secondary">Join the F.R.E.D. community</p>
        </div>
        {error && <div className="alert alert-error mb-4">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="input-label">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Your username" required />
          </div>
          <div>
            <label className="input-label">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
          </div>
          <div>
            <label className="input-label">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
            Create account
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
      <style>{`
        .auth-card {
          width: 380px;
          max-width: 90vw;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 32px;
          box-shadow: var(--shadow-md);
        }
        .auth-header { text-align: center; margin-bottom: 24px; }
        .auth-logo {
          width: 48px; height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--accent), #7c3aed);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 800;
          margin-bottom: 16px;
        }
        .auth-header h2 { font-size: 1.3rem; font-weight: 700; margin-bottom: 4px; }
        .input-label { display: block; margin-bottom: 6px; color: var(--text-secondary); font-size: 0.85rem; font-weight: 500; }
        .auth-footer { text-align: center; margin-top: 20px; color: var(--text-muted); font-size: 0.85rem; }
      `}</style>
    </div>
  );
}
