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
      <div className="card" style={{ textAlign: 'center', padding: 32, borderLeft: '4px solid var(--accent-green)' }}>
        <p style={{ color: 'var(--accent-green)', fontWeight: 600 }}>ELITE role activated! Reloading...</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 24, padding: 24 }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '2rem', lineHeight: 1 }}>🏁</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>Become a Championship Organizer</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
            ELITE members can create and manage championships, enter results, and administer events.
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="password"
              placeholder="Password for ELITE role:"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUpgrade()}
              style={{ width: 220, padding: '7px 10px', fontSize: '0.85rem' }}
            />
            <button className="btn btn-primary" onClick={handleUpgrade} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
              {loading ? 'Verifying...' : 'Upgrade to ELITE'}
            </button>
          </div>
          {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.82rem', marginTop: 6 }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}
