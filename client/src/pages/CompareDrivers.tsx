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
        <p className="text-sm text-secondary mb-6">Select a series and two drivers to compare their performance</p>

        <div className="card mb-6">
          <div className="grid grid-3" style={{ alignItems: 'end' }}>
            <div>
              <label className="input-label">Series</label>
              <select value={selectedChamp} onChange={e => { setSelectedChamp(e.target.value); setDriver1(''); setDriver2(''); setComparison(null); }}>
                <option value="">Select series</option>
                {champs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Driver 1</label>
              <select value={driver1} onChange={e => setDriver1(e.target.value)} disabled={!selectedChamp}>
                <option value="">Select driver</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Driver 2</label>
              <select value={driver2} onChange={e => setDriver2(e.target.value)} disabled={!selectedChamp}>
                <option value="">Select driver</option>
                {drivers.filter(d => d.id !== driver1).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-primary mt-4" onClick={compare} disabled={!driver1 || !driver2 || loading}>
            {loading ? 'Loading...' : 'Compare'}
          </button>
        </div>

        {comparison && (
          <div className="fade-in">
            <div className="grid grid-2 mb-6">
              {[comparison.d1, comparison.d2].map((d: any, i: number) => (
                <div key={i} className="card" style={{ borderTop: `3px solid ${i === 0 ? 'var(--accent)' : 'var(--accent-orange)'}` }}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="avatar avatar-lg" style={{ background: i === 0 ? 'var(--accent-light)' : 'var(--accent-orange-light)', color: i === 0 ? 'var(--accent)' : 'var(--accent-orange)' }}>
                      {d.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{d.name}</h3>
                      <p className="text-sm text-secondary">{d.team_name || 'No team'} · #{d.number}</p>
                    </div>
                  </div>
                  <div className="grid grid-2" style={{ gap: 10 }}>
                    <div className="stat-card" style={{ padding: 12 }}>
                      <div className="value" style={{ fontSize: '1.3rem' }}>{d.points || 0}</div>
                      <div className="label">Points</div>
                    </div>
                    <div className="stat-card" style={{ padding: 12 }}>
                      <div className="value" style={{ fontSize: '1.3rem' }}>{d.wins || 0}</div>
                      <div className="label">Wins</div>
                    </div>
                    <div className="stat-card" style={{ padding: 12 }}>
                      <div className="value" style={{ fontSize: '1.3rem' }}>{d.podiums || 0}</div>
                      <div className="label">Podiums</div>
                    </div>
                    <div className="stat-card" style={{ padding: 12 }}>
                      <div className="value" style={{ fontSize: '1.3rem' }}>{d.poles || 0}</div>
                      <div className="label">Poles</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Head-to-Head Comparison</span></div>
              <div style={{ width: '100%', height: 340 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="category" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }} />
                    <Bar dataKey={comparison.d1.name} fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey={comparison.d2.name} fill="var(--accent-orange)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .input-label { display: block; margin-bottom: 6px; color: var(--text-secondary); font-size: 0.85rem; font-weight: 500; }
      `}</style>
    </div>
  );
}
