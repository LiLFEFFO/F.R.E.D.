import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export default function EliteRequestCard() {
  const { user, login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!user || user.role === 'elite') return null;

  const handleUpgrade = async () => {
    setError('');
    if (!password) { setError('Enter the ELITE password'); return; }
    setLoading(true);
    try {
      const data = await api.auth.upgradeElite(password);
      localStorage.setItem('fred_token', data.token);
      setSuccess(true);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setError(err.message || 'Wrong password');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="alert alert-success mb-6">
        ELITE role activated! Reloading...
      </div>
    );
  }

  return (
    <div className="card mb-6" style={{ borderLeft: '3px solid var(--accent-gold)', padding: 24 }}>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="avatar avatar-lg" style={{ background: 'var(--accent-gold-light)', color: 'var(--accent-gold)', fontSize: '1.3rem' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h3 className="font-semibold mb-1">Become an Organizer</h3>
          <p className="text-sm text-secondary mb-3">
            ELITE members can create and manage championships, enter results, and administer events.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="password"
              placeholder="ELITE password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUpgrade()}
              style={{ width: 200 }}
            />
            <button className="btn btn-primary" onClick={handleUpgrade} disabled={loading}>
              {loading ? 'Verifying...' : 'Upgrade to ELITE'}
            </button>
          </div>
          {error && <p className="text-sm text-red mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
