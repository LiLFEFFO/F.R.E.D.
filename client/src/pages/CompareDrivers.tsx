import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function CompareDrivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [champs, setChamps] = useState<any[]>([]);
  const [selectedChamp, setSelectedChamp] = useState('');
  const [driver1, setDriver1] = useState('');
  const [driver2, setDriver2] = useState('');
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.championships.list({ limit: 50 }).then(d => setChamps(d.championships));
  }, []);

  useEffect(() => {
    if (selectedChamp) {
      api.drivers.list({ championship_id: selectedChamp }).then(setDrivers);
    }
  }, [selectedChamp]);

  const compare = async () => {
    if (!driver1 || !driver2) return;
    setLoading(true);
    try {
      const [d1, d2] = await Promise.all([
        api.drivers.get(driver1),
        api.drivers.get(driver2),
      ]);
      setComparison({ d1, d2 });
    } catch {}
    setLoading(false);
  };

  const chartData = comparison
    ? [
        { category: 'Points', [comparison.d1.name]: comparison.d1.points || 0, [comparison.d2.name]: comparison.d2.points || 0 },
        { category: 'Wins', [comparison.d1.name]: comparison.d1.wins || 0, [comparison.d2.name]: comparison.d2.wins || 0 },
        { category: 'Podiums', [comparison.d1.name]: comparison.d1.podiums || 0, [comparison.d2.name]: comparison.d2.podiums || 0 },
        { category: 'Poles', [comparison.d1.name]: comparison.d1.poles || 0, [comparison.d2.name]: comparison.d2.poles || 0 },
        { category: 'FL', [comparison.d1.name]: comparison.d1.fastest_laps || 0, [comparison.d2.name]: comparison.d2.fastest_laps || 0 },
        { category: 'Races', [comparison.d1.name]: comparison.d1.races_done || 0, [comparison.d2.name]: comparison.d2.races_done || 0 },
      ]
    : [];

  return (
    <div className="page">
      <div className="container">
        <h1 className="section-title">Compare Drivers</h1>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="grid grid-3" style={{ alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Series</label>
              <select value={selectedChamp} onChange={e => { setSelectedChamp(e.target.value); setDriver1(''); setDriver2(''); setComparison(null); }}>
                <option value="">Select series</option>
                {champs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Driver 1</label>
              <select value={driver1} onChange={e => setDriver1(e.target.value)}>
                <option value="">Select</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Driver 2</label>
              <select value={driver2} onChange={e => setDriver2(e.target.value)}>
                <option value="">Select</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-primary" onClick={compare} disabled={!driver1 || !driver2 || loading} style={{ marginTop: 12 }}>
            {loading ? 'Loading...' : 'Compare'}
          </button>
        </div>

        {comparison && (
          <>
            <div className="grid grid-2" style={{ marginBottom: 20 }}>
              <div className="card" style={{ textAlign: 'center', padding: 24 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>{comparison.d1.name}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>#{comparison.d1.number} · {comparison.d1.team_name || 'No team'}</p>
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Points</span><div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{comparison.d1.points || 0}</div></div>
                  <div><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Wins</span><div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{comparison.d1.wins || 0}</div></div>
                  <div><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Podiums</span><div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{comparison.d1.podiums || 0}</div></div>
                  <div><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Poles</span><div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{comparison.d1.poles || 0}</div></div>
                </div>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: 24 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>{comparison.d2.name}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>#{comparison.d2.number} · {comparison.d2.team_name || 'No team'}</p>
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Points</span><div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{comparison.d2.points || 0}</div></div>
                  <div><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Wins</span><div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{comparison.d2.wins || 0}</div></div>
                  <div><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Podiums</span><div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{comparison.d2.podiums || 0}</div></div>
                  <div><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Poles</span><div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{comparison.d2.poles || 0}</div></div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Comparison Chart</span></div>
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="category" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }} />
                    <Legend />
                    <Bar dataKey={comparison.d1.name} fill="var(--accent)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey={comparison.d2.name} fill="#ea580c" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
