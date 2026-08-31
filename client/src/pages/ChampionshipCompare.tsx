import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import CountryFlag from '../components/CountryFlag';
import { useTheme } from '../contexts/ThemeContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function readableTeamColor(color: string | undefined, theme: 'light' | 'dark'): string {
  if (!color) return theme === 'dark' ? '#818cf8' : '#4f46e5';
  let c = color.trim();
  if (!c.startsWith('#')) return c;
  if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
  if (c.length !== 7) return color;
  const r = parseInt(c.slice(1, 3), 16);
  const g = parseInt(c.slice(3, 5), 16);
  const b = parseInt(c.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (theme === 'light' && lum > 0.88) return '#334155';
  if (theme === 'light' && lum > 0.82 && r > 200 && g > 200 && b < 120) return '#92400e'; // pale yellow
  if (theme === 'dark' && lum < 0.18) return '#e2e8f0';
  return color;
}

type MatrixData = {
  championship: any;
  drivers: any[];
  races: any[];
  matrix: Record<string, Record<string, any>>;
};

export default function ChampionshipCompare() {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const [data, setData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [sessionMode, setSessionMode] = useState<'total' | 'race' | 'sprint' | 'qualifying'>('total');

  useEffect(() => {
    if (!id) return;
    api.championships.resultsMatrix(id)
      .then(d => {
        setData(d);
        // auto-select top 4 by standings or first 4
        const top = d.drivers.slice(0, 4).map((x: any) => x.id);
        setSelected(top);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const toggleDriver = (driverId: string) => {
    setSelected(prev => {
      if (prev.includes(driverId)) return prev.filter(x => x !== driverId);
      if (prev.length >= 6) return prev; // max 6
      return [...prev, driverId];
    });
  };

  const chartData = useMemo(() => {
    if (!data || selected.length === 0) return [];
    const completedRaces = data.races.filter(r => r.status === 'completed');
    // build cumulative per driver
    const cumul: Record<string, number> = {};
    selected.forEach(s => cumul[s] = 0);
    const rows: any[] = [];
    for (const race of completedRaces) {
      const row: any = { name: race.name.length > 14 ? race.name.substring(0, 14) + '…' : race.name, fullName: race.name, date: race.date };
      for (const driverId of selected) {
        const driver = data.drivers.find(d => d.id === driverId);
        const cell = data.matrix[driverId]?.[race.id];
        let add = 0;
        if (sessionMode === 'total') {
          add = (cell?.race?.points || 0) + (cell?.sprint?.points || 0);
        } else if (sessionMode === 'race') {
          add = cell?.race?.points || 0;
        } else if (sessionMode === 'sprint') {
          add = cell?.sprint?.points || 0;
        } else if (sessionMode === 'qualifying') {
          // qualifying has no points except pole bonus is inside race points; we show 1 if pole else 0 for visualization
          // fallback: show qualifying position inverted as points? Better show pole bonus = 1 if pole else 0
          add = cell?.race?.pole ? 1 : 0;
        }
        cumul[driverId] += add;
        row[driver!.name] = cumul[driverId];
        row[`${driver!.name}_add`] = add;
        row[`${driver!.name}_color`] = driver!.team_color || '#6366f1';
      }
      rows.push(row);
    }
    return rows;
  }, [data, selected, sessionMode]);

  const selectedDrivers = useMemo(() => {
    if (!data) return [];
    return data.drivers.filter(d => selected.includes(d.id));
  }, [data, selected]);

  if (loading) return <div className="page"><div className="loading"><div className="spinner" /></div></div>;
  if (!data) return <div className="page"><div className="empty-state"><h3>Championship not found</h3></div></div>;

  const { championship, drivers, races } = data;
  const completedRaces = races.filter(r => r.status === 'completed');

  return (
    <div className="page">
      <div className="container">
        <Link to={`/championships/${championship.id}`} className="btn btn-ghost btn-sm mb-4" style={{ display: 'inline-flex' }}>
          ← Back to {championship.name}
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
          <h1 className="section-title" style={{ marginBottom: 0 }}>Championship Comparison — {championship.name}</h1>
          <Link to={`/championships/${championship.id}/matrix`} className="btn btn-secondary btn-sm">Full Sheet →</Link>
        </div>
        <p className="text-sm text-secondary mb-4">Select up to 6 drivers. Chart shows cumulative points progression (team color) across completed races. Toggle session to see Race / Sprint / Qualifying breakdown.</p>

        <div className="tabs" style={{ marginBottom: 16 }}>
          <button className={`tab ${sessionMode === 'total' ? 'active' : ''}`} onClick={() => setSessionMode('total')}>Total (Race+Sprint)</button>
          <button className={`tab ${sessionMode === 'race' ? 'active' : ''}`} onClick={() => setSessionMode('race')}>Race only</button>
          <button className={`tab ${sessionMode === 'sprint' ? 'active' : ''}`} onClick={() => setSessionMode('sprint')}>Sprint only</button>
          <button className={`tab ${sessionMode === 'qualifying' ? 'active' : ''}`} onClick={() => setSessionMode('qualifying')}>Qualifying (Pole)</button>
        </div>

        <div className="card mb-6">
          <div className="card-header"><span className="card-title">Select Drivers ({selected.length}/6)</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected([])}>Clear</button>
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {drivers.map(d => {
              const isSelected = selected.includes(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => toggleDriver(d.id)}
                  className="driver-select-card"
                  style={{
                    borderColor: isSelected ? (d.team_color || 'var(--accent)') : 'var(--border)',
                    background: isSelected ? `${d.team_color}14` : 'var(--bg-card)',
                  }}
                >
                  <span className="team-dot" style={{ background: d.team_color || 'var(--text-muted)', width: 10, height: 10 }} />
                  <CountryFlag nationality={d.nationality} />
                  <span className="driver-select-name">{d.name}</span>
                  <span className="text-muted text-xs">#{d.number}</span>
                  {isSelected && <span className="badge badge-blue" style={{ marginLeft: 'auto', fontSize: '0.6rem' }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {selected.length === 0 ? (
          <div className="empty-state"><h3>No drivers selected</h3><p>Pick at least one driver to see the chart.</p></div>
        ) : completedRaces.length === 0 ? (
          <div className="empty-state"><h3>No completed races yet</h3><p>Points progression will appear after first results.</p></div>
        ) : (
          <>
            <div className="card mb-6">
              <div className="card-header">
                <span className="card-title">
                  {sessionMode === 'total' ? 'Cumulative Points Progression' : sessionMode === 'race' ? 'Race Points Progression' : sessionMode === 'sprint' ? 'Sprint Points Progression' : 'Pole Positions (Qualifying)'} 
                </span>
                <span className="badge badge-blue">{completedRaces.length} races</span>
              </div>
              <div style={{ width: '100%', height: 380 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--border)" fontSize={11} tick={{ fill: 'var(--text-muted)' }} interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis stroke="var(--border)" fontSize={11} tick={{ fill: 'var(--text-muted)' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text)' }}
                      labelStyle={{ color: 'var(--text)' }}
                      itemStyle={{ color: 'var(--text)' }}
                      formatter={(value: any, name: string, props: any) => {
                        const add = props.payload[`${name}_add`];
                        return [`${value} pts (+${add} this race)`, name];
                      }}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                    />
                    <Legend
                      wrapperStyle={{ color: 'var(--text)', fontSize: '0.8rem' }}
                      formatter={(value: string) => <span style={{ color: 'var(--text)' }}>{value}</span>}
                    />
                    {selectedDrivers.map(d => {
                      const lineColor = readableTeamColor(d.team_color, theme);
                      return (
                        <Line
                          key={d.id}
                          type="monotone"
                          dataKey={d.name}
                          stroke={lineColor}
                          strokeWidth={2.5}
                          dot={{ r: 3, strokeWidth: 1, fill: lineColor, stroke: lineColor }}
                          activeDot={{ r: 6, fill: lineColor, stroke: 'var(--bg-card)', strokeWidth: 2 }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Points Breakdown per Race</span></div>
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Race</th>
                      {selectedDrivers.map(d => (
                        <th key={d.id}>
                          <span className="team-dot" style={{ background: d.team_color || 'var(--text-muted)' }} />
                          <CountryFlag nationality={d.nationality} /> {d.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {completedRaces.map(race => (
                      <tr key={race.id}>
                        <td className="font-medium">
                          <div style={{ fontSize: '0.85rem' }}>{race.name}</div>
                          <div className="text-xs text-muted">{race.circuit} · {new Date(race.date).toLocaleDateString()}</div>
                        </td>
                        {selectedDrivers.map(d => {
                          const cell = data.matrix[d.id]?.[race.id];
                          let content: string;
                          let sub: string | null = null;
                          if (sessionMode === 'sprint') {
                            if (!race.has_sprint) content = '—';
                            else if (!cell?.sprint) content = '—';
                            else if (!cell.sprint.present) content = 'DNS';
                            else if (cell.sprint.dnf) content = 'DNF';
                            else content = `P${cell.sprint.position}`;
                            sub = cell?.sprint?.points != null ? `${cell.sprint.points} pts` : null;
                          } else if (sessionMode === 'qualifying') {
                            if (cell?.qualifying == null) content = '—';
                            else content = `P${cell.qualifying}`;
                            sub = cell?.race?.pole ? 'Pole' : null;
                          } else if (sessionMode === 'race') {
                            if (!cell?.race) content = '—';
                            else if (!cell.race.present) content = 'DNS';
                            else if (cell.race.dnf) content = 'DNF';
                            else content = `P${cell.race.position}`;
                            sub = cell?.race?.points != null ? `${cell.race.points} pts` : null;
                          } else {
                            const pts = (cell?.race?.points || 0) + (cell?.sprint?.points || 0);
                            if (!cell?.race && !cell?.sprint) content = '—';
                            else if (cell?.race && !cell.race.present && (!cell.sprint || !cell.sprint.present)) content = 'DNS';
                            else if (cell?.race?.dnf && cell?.sprint?.dnf) content = 'DNF';
                            else {
                              const rPos = cell?.race ? `R:P${cell.race.position}` : '';
                              const sPos = race.has_sprint && cell?.sprint ? ` S:P${cell.sprint.position}` : '';
                              content = `${rPos}${sPos}`.trim() || '—';
                            }
                            sub = `${pts} pts`;
                          }
                          const isWin = (sessionMode === 'race' || sessionMode === 'total') && cell?.race?.position === 1;
                          const isPole = sessionMode === 'qualifying' && cell?.qualifying === 1;
                          return (
                            <td key={d.id} className={isWin || isPole ? 'font-bold text-accent' : ''}>
                              <div>{content}</div>
                              {sub && <div className="text-xs text-muted">{sub}</div>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                      <td>Total</td>
                      {selectedDrivers.map(d => {
                        const lastRow = chartData[chartData.length - 1];
                        return <td key={d.id} className="text-accent">{lastRow?.[d.name] ?? 0} pts</td>;
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .driver-select-card {
          display: flex; align-items: center; gap: 6px; padding: 10px 12px; border: 1.5px solid var(--border); border-radius: var(--radius-sm);
          background: var(--bg-card); cursor: pointer; transition: all var(--transition); font-size: 0.85rem; font-weight: 500; text-align: left; width: 100%;
        }
        .driver-select-card:hover { border-color: var(--text-muted); transform: translateY(-1px); }
        .driver-select-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      `}</style>
    </div>
  );
}
