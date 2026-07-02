import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Championship, DriverStanding, ConstructorStanding, Race, TitleScenariosResponse } from '../types';

export default function ChampionshipDetail() {
  const { id } = useParams<{ id: string }>();
  const [champ, setChamp] = useState<Championship | null>(null);
  const [standings, setStandings] = useState<{ driver_standings: DriverStanding[]; constructor_standings: ConstructorStanding[] } | null>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [scenarios, setScenarios] = useState<TitleScenariosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'standings' | 'constructors' | 'calendar' | 'title'>('overview');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.championships.get(id),
      api.championships.standings(id),
      api.races.list(id),
      api.championships.titleScenarios(id).catch(() => null),
    ]).then(([c, s, r, sc]) => {
      setChamp(c);
      setStandings(s);
      setRaces(r);
      setScenarios(sc);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><div className="loading"><div className="spinner" /></div></div>;
  if (!champ) return <div className="page"><div className="empty-state"><h3>Series not found</h3></div></div>;

  const driverSt = standings?.driver_standings || [];
  const constructorSt = standings?.constructor_standings || [];
  const completedRaces = races.filter(r => r.status === 'completed');
  const upcomingRaces = races.filter(r => r.status !== 'completed');
  const nextRace = upcomingRaces[0];

  return (
    <div className="page">
      <div className="container">
        <div className="card" style={{ marginBottom: 24, padding: 28 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <span className="badge badge-blue">{champ.season}</span>
            {(champ as any).status === 'concluded' && <span className="badge badge-green">Concluded</span>}
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 6 }}>{champ.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 14, maxWidth: 600 }}>
            {champ.description || 'No description'}
          </p>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Organizer: {champ.organizer_name}</span>
            <span style={{ color: 'var(--text-muted)' }}>Drivers: {champ.driver_count}</span>
            <span style={{ color: 'var(--text-muted)' }}>Races: {champ.completed_races}/{champ.race_count}</span>
            <span style={{ color: 'var(--text-muted)' }}>Max: {champ.max_participants}</span>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
          <button className={`tab ${tab === 'standings' ? 'active' : ''}`} onClick={() => setTab('standings')}>Driver Standings</button>
          <button className={`tab ${tab === 'constructors' ? 'active' : ''}`} onClick={() => setTab('constructors')}>Constructor Standings</button>
          <button className={`tab ${tab === 'calendar' ? 'active' : ''}`} onClick={() => setTab('calendar')}>Calendar</button>
          <button className={`tab ${tab === 'title' ? 'active' : ''}`} onClick={() => setTab('title')}>Title Fight</button>
        </div>

        {tab === 'overview' && (
          <>
            {nextRace && (
              <div className="card" style={{ marginBottom: 20, borderLeft: '3px solid var(--accent)' }}>
                <div className="card-header">
                  <span className="card-title">Next Race</span>
                  <span className="badge badge-blue">Upcoming</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: '1.05rem' }}>{nextRace.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{nextRace.circuit}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {new Date(nextRace.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{nextRace.weather}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-2">
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Driver Standings</span>
                  <Link to={`/championships/${champ.id}/standings`} className="btn btn-ghost btn-sm">Details</Link>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>#</th><th>Driver</th><th>Team</th><th>Points</th></tr>
                    </thead>
                    <tbody>
                      {driverSt.slice(0, 5).map(d => (
                        <tr key={d.driver_id}>
                          <td style={{ fontWeight: 600 }}>
                            {d.position}
                            <PositionIndicator current={d.position} previous={d.previous_position} />
                          </td>
                          <td>
                            <Link to={`/drivers/${d.driver_id}`} style={{ color: 'var(--text)', fontWeight: 500 }}>
                              {d.driver_name}
                            </Link>
                          </td>
                          <td><span style={{ color: d.team_color || 'var(--text-muted)' }}>■ </span>{d.team_name || '-'}</td>
                          <td style={{ fontWeight: 600 }}>{d.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="card-title">Constructor Standings</span>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>#</th><th>Team</th><th>Points</th></tr>
                    </thead>
                    <tbody>
                      {constructorSt.slice(0, 5).map(c => (
                        <tr key={c.team_id}>
                          <td style={{ fontWeight: 600 }}>
                            {c.position}
                            <PositionIndicator current={c.position} previous={c.previous_position} />
                          </td>
                          <td><span style={{ color: c.team_color || 'var(--text-muted)' }}>■ </span>{c.team_name}</td>
                          <td style={{ fontWeight: 600 }}>{c.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-header">
                <span className="card-title">Recent Results</span>
              </div>
              {champ.last_results && champ.last_results.length > 0 ? (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>Race</th><th>Circuit</th><th>Date</th><th>Driver</th><th>Pos</th><th>QL</th><th>Pts</th></tr>
                    </thead>
                    <tbody>
                      {(champ.last_results as any[]).slice(0, 10).map((r: any, i: number) => (
                        <tr key={r.id || i}>
                          <td><Link to={`/races/${r.race_id}`} style={{ color: 'var(--accent)' }}>{r.race_name}</Link></td>
                          <td style={{ color: 'var(--text-secondary)' }}>{r.circuit}</td>
                          <td>{new Date(r.race_date).toLocaleDateString()}</td>
                          <td style={{ fontWeight: 500 }}>{r.driver_name}</td>
                          <td><span className={`badge ${r.position === 1 ? 'badge-gold' : r.position <= 3 ? 'badge-green' : ''}`}>{r.position}°</span></td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{r.qualifying_position != null ? r.qualifying_position : '—'}</td>
                          <td style={{ fontWeight: 600 }}>{r.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 16, fontSize: '0.85rem' }}>No results yet</p>
              )}
            </div>

            {champ.rules && (
              <div className="card" style={{ marginTop: 20 }}>
                <div className="card-header">
                  <span className="card-title">Regulations</span>
                </div>
                <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'var(--font)', lineHeight: 1.7 }}>{champ.rules}</pre>
              </div>
            )}
          </>
        )}

        {tab === 'standings' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Driver Standings</span>
              <Link to={`/championships/${champ.id}/standings`} className="btn btn-primary btn-sm">Statistics</Link>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Driver</th><th>Team</th><th>Points</th><th>Wins</th><th>Podiums</th><th>Poles</th><th>FL</th><th>Races</th>
                  </tr>
                </thead>
                <tbody>
                  {driverSt.map(d => (
                    <tr key={d.driver_id}>
                      <td style={{ fontWeight: 600 }}>
                        {d.position}
                        <PositionIndicator current={d.position} previous={d.previous_position} />
                      </td>
                      <td>
                        <Link to={`/drivers/${d.driver_id}`} style={{ color: 'var(--text)', fontWeight: 500 }}>
                          {d.driver_name}
                        </Link>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: '0.78rem' }}>#{d.driver_number}</span>
                      </td>
                      <td><span style={{ color: d.team_color || 'var(--text-muted)' }}>■ </span>{d.team_name || '-'}</td>
                      <td style={{ fontWeight: 700 }}>{d.points}</td>
                      <td>{d.wins}</td>
                      <td>{d.podiums}</td>
                      <td>{d.poles}</td>
                      <td>{d.fastest_laps}</td>
                      <td>{d.races_done}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'constructors' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Constructor Standings</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>#</th><th>Team</th><th>Points</th><th>Drivers</th></tr>
                </thead>
                <tbody>
                  {constructorSt.map(c => (
                    <tr key={c.team_id}>
                      <td style={{ fontWeight: 600 }}>
                        {c.position}
                        <PositionIndicator current={c.position} previous={c.previous_position} />
                      </td>
                      <td><span style={{ color: c.team_color || 'var(--text-muted)' }}>■ </span><strong>{c.team_name}</strong></td>
                      <td style={{ fontWeight: 700 }}>{c.points}</td>
                      <td>{c.driver_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'calendar' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Race Calendar</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {races.map(r => (
                <div key={r.id} style={{
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 14,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
                  background: r.status === 'completed' ? 'rgba(22,163,74,0.03)' : r.status === 'in_progress' ? 'rgba(234,88,12,0.03)' : 'transparent'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <strong style={{ fontSize: '0.9rem' }}>{r.name}</strong>
                      {r.status === 'completed' && <span className="badge badge-green">Done</span>}
                      {r.status === 'in_progress' && <span className="badge badge-orange">Live</span>}
                      {r.status === 'scheduled' && <span className="badge badge-blue">Scheduled</span>}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{r.circuit} · {r.weather}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                      {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {r.status === 'completed' && (
                      <Link to={`/races/${r.id}`} className="btn btn-ghost btn-sm">Results</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'title' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Title Scenarios</span>
              {scenarios?.next_race && (
                <span className="badge badge-blue">{scenarios.remaining_races} races left</span>
              )}
            </div>
            {!scenarios ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24, fontSize: '0.85rem' }}>Loading...</p>
            ) : scenarios.scenarios.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24, fontSize: '0.85rem' }}>
                {scenarios.concluded ? 'Championship concluded' : scenarios.no_next_race ? 'No upcoming races' : 'No title contenders'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {scenarios.next_race && (
                  <div style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 12, marginBottom: 4 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>Next Race: {scenarios.next_race.name}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{scenarios.next_race.circuit} · {new Date(scenarios.next_race.date).toLocaleDateString()}</p>
                  </div>
                )}
                {scenarios.scenarios.map(s => (
                  <div key={s.driver_id} style={{
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 14,
                    borderLeft: `3px solid ${s.can_win_next_race ? 'var(--accent-green)' : 'var(--text-muted)'}`,
                    background: s.can_win_next_race ? 'rgba(22,163,74,0.03)' : 'transparent',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.driver_name}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: '0.78rem' }}>#{s.driver_number}</span>
                        <span style={{ color: s.team_color, marginLeft: 4 }}>■ {s.team_name}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.current_points} pts</span>
                        {s.can_win_next_race && <span className="badge badge-green" style={{ marginLeft: 6 }}>Can clinch!</span>}
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                      {s.scenario_description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PositionIndicator({ current, previous }: { current: number; previous: number }) {
  if (!previous || previous === 0) return <span className="position-same" style={{ fontSize: '0.75rem', marginLeft: 4 }}>–</span>;
  if (current < previous) return <span className="position-up" style={{ fontSize: '0.75rem', marginLeft: 4 }}>▲{previous - current}</span>;
  if (current > previous) return <span className="position-down" style={{ fontSize: '0.75rem', marginLeft: 4 }}>▼{current - previous}</span>;
  return <span className="position-same" style={{ fontSize: '0.75rem', marginLeft: 4 }}>–</span>;
}
