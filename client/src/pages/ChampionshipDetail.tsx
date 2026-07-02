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
        <div className="champ-header card fade-in" style={{ marginBottom: 24, padding: 28 }}>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="badge badge-blue">{champ.season}</span>
            {(champ as any).status === 'concluded' && <span className="badge badge-green">Concluded</span>}
          </div>
          <h1 className="champ-title">{champ.name}</h1>
          <p className="champ-desc">{champ.description || 'No description'}</p>
          <div className="champ-meta">
            <span>Organizer: {champ.organizer_name}</span>
            <span>Drivers: {champ.driver_count}</span>
            <span>Races: {champ.completed_races}/{champ.race_count}</span>
            <span>Max: {champ.max_participants}</span>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
          <button className={`tab ${tab === 'standings' ? 'active' : ''}`} onClick={() => setTab('standings')}>Drivers</button>
          <button className={`tab ${tab === 'constructors' ? 'active' : ''}`} onClick={() => setTab('constructors')}>Constructors</button>
          <button className={`tab ${tab === 'calendar' ? 'active' : ''}`} onClick={() => setTab('calendar')}>Calendar</button>
          <button className={`tab ${tab === 'title' ? 'active' : ''}`} onClick={() => setTab('title')}>Title Fight</button>
        </div>

        {tab === 'overview' && (
          <>
            {nextRace && (
              <div className="card mb-4 next-race-card">
                <div className="card-header">
                  <span className="card-title">Next Race</span>
                  <span className="badge badge-blue">Upcoming</span>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{nextRace.name}</h3>
                    <p className="text-sm text-secondary">{nextRace.circuit}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="font-semibold">
                      {new Date(nextRace.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-sm text-secondary">{nextRace.weather}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-2 mb-4">
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Driver Standings</span>
                  <div className="flex gap-2">
                    <Link to={`/championships/${champ.id}/standings`} className="btn btn-ghost btn-sm">Details</Link>
                    <Link to={`/championships/${champ.id}/statistics`} className="btn btn-ghost btn-sm">Stats</Link>
                  </div>
                </div>
                <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                  <table>
                    <thead>
                      <tr><th>#</th><th>Driver</th><th>Team</th><th>Points</th></tr>
                    </thead>
                    <tbody>
                      {driverSt.slice(0, 5).map(d => (
                        <tr key={d.driver_id}>
                          <td className="font-bold">
                            <span className={`pos-indicator ${d.position === 1 ? 'gold' : d.position <= 3 ? 'podium' : ''}`}>
                              {d.position}
                            </span>
                            <PositionIndicator current={d.position} previous={d.previous_position} />
                          </td>
                          <td><Link to={`/drivers/${d.driver_id}`} className="driver-link" style={{ fontWeight: 500 }}>{d.driver_name}</Link></td>
                          <td><span className="team-dot" style={{ background: d.team_color || 'var(--text-muted)' }} />{d.team_name || '-'}</td>
                          <td className="font-bold text-accent">{d.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {driverSt.length > 5 && (
                  <div className="mt-3 text-center">
                    <Link to={`/championships/${champ.id}/standings`} className="btn btn-ghost btn-sm">View all {driverSt.length} drivers →</Link>
                  </div>
                )}
              </div>

              {constructorSt.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Constructor Standings</span>
                  </div>
                  <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                    <table>
                      <thead>
                        <tr><th>#</th><th>Team</th><th>Points</th></tr>
                      </thead>
                      <tbody>
                        {constructorSt.slice(0, 5).map(c => (
                          <tr key={c.team_id}>
                            <td className="font-bold">
                              <span className={`pos-indicator ${c.position === 1 ? 'gold' : c.position <= 3 ? 'podium' : ''}`}>
                                {c.position}
                              </span>
                              <PositionIndicator current={c.position} previous={c.previous_position} />
                            </td>
                            <td><span className="team-dot" style={{ background: c.team_color || 'var(--text-muted)' }} />{c.team_name}</td>
                            <td className="font-bold text-accent">{c.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="card mb-4">
              <div className="card-header">
                <span className="card-title">Recent Results</span>
              </div>
              {champ.last_results && champ.last_results.length > 0 ? (
                <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                  <table>
                    <thead>
                      <tr><th>Race</th><th>Circuit</th><th>Date</th><th>Driver</th><th>Pos</th><th>QL</th><th>Pts</th></tr>
                    </thead>
                    <tbody>
                      {(champ.last_results as any[]).slice(0, 10).map((r: any, i: number) => (
                        <tr key={r.id || i}>
                          <td><Link to={`/races/${r.race_id}`} style={{ fontWeight: 500 }}>{r.race_name}</Link></td>
                          <td className="text-secondary text-sm">{r.circuit}</td>
                          <td className="text-muted text-sm">{new Date(r.race_date).toLocaleDateString()}</td>
                          <td className="font-medium">{r.driver_name}</td>
                          <td><span className={`badge ${r.position === 1 ? 'badge-gold' : r.position <= 3 ? 'badge-green' : ''}`}>{r.position}°</span></td>
                          <td className="text-muted text-xs">{r.qualifying_position != null ? r.qualifying_position : '—'}</td>
                          <td className="font-bold">{r.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted text-center p-5 text-sm">No results yet</p>
              )}
            </div>

            {champ.rules && (
              <div className="card">
                <div className="card-header"><span className="card-title">Regulations</span></div>
                <div className="rules-text">{champ.rules}</div>
              </div>
            )}
          </>
        )}

        {tab === 'standings' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Driver Standings</span>
              <Link to={`/championships/${champ.id}/statistics`} className="btn btn-primary btn-sm">Statistics</Link>
            </div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Driver</th><th>Team</th><th>Points</th><th>Wins</th><th>Podiums</th><th>Poles</th><th>FL</th><th>Races</th>
                  </tr>
                </thead>
                <tbody>
                  {driverSt.map(d => (
                    <tr key={d.driver_id}>
                      <td className="font-bold">
                        <span className={`pos-indicator ${d.position === 1 ? 'gold' : d.position <= 3 ? 'podium' : ''}`}>
                          {d.position}
                        </span>
                        <PositionIndicator current={d.position} previous={d.previous_position} />
                      </td>
                      <td>
                        <Link to={`/drivers/${d.driver_id}`} className="driver-link" style={{ fontWeight: 500 }}>
                          {d.driver_name}
                        </Link>
                        <span className="text-muted text-xs" style={{ marginLeft: 6 }}>#{d.driver_number}</span>
                      </td>
                      <td><span className="team-dot" style={{ background: d.team_color || 'var(--text-muted)' }} />{d.team_name || '-'}</td>
                      <td className="font-bold text-accent">{d.points}</td>
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

        {tab === 'constructors' && constructorSt.length > 0 && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Constructor Standings</span>
            </div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr><th>#</th><th>Team</th><th>Points</th><th>Drivers</th></tr>
                </thead>
                <tbody>
                  {constructorSt.map(c => (
                    <tr key={c.team_id}>
                      <td className="font-bold">
                        <span className={`pos-indicator ${c.position === 1 ? 'gold' : c.position <= 3 ? 'podium' : ''}`}>
                          {c.position}
                        </span>
                        <PositionIndicator current={c.position} previous={c.previous_position} />
                      </td>
                      <td><span className="team-dot" style={{ background: c.team_color || 'var(--text-muted)' }} /><strong>{c.team_name}</strong></td>
                      <td className="font-bold text-accent">{c.points}</td>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {races.map(r => (
                <div key={r.id} className="race-item" style={{
                  background: r.status === 'completed' ? 'var(--accent-green-light)' : r.status === 'in_progress' ? 'var(--accent-orange-light)' : 'transparent'
                }}>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-sm">{r.name}</strong>
                      {r.status === 'completed' && <span className="badge badge-green">Done</span>}
                      {r.status === 'in_progress' && <span className="badge badge-orange">Live</span>}
                      {r.status === 'scheduled' && <span className="badge badge-blue">Scheduled</span>}
                    </div>
                    <p className="text-sm text-secondary">{r.circuit} · {r.weather}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="font-medium text-sm">
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
              <p className="text-muted text-center p-5 text-sm">Loading...</p>
            ) : scenarios.scenarios.length === 0 ? (
              <p className="text-muted text-center p-5 text-sm">
                {scenarios.concluded ? 'Championship concluded' : scenarios.no_next_race ? 'No upcoming races' : 'No title contenders'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {scenarios.next_race && (
                  <div className="next-race-info">
                    <p className="font-semibold text-sm">Next Race: {scenarios.next_race.name}</p>
                    <p className="text-xs text-secondary">{scenarios.next_race.circuit} · {new Date(scenarios.next_race.date).toLocaleDateString()}</p>
                  </div>
                )}
                {scenarios.scenarios.map(s => (
                  <div key={s.driver_id} className="scenario-card" style={{
                    borderLeft: `3px solid ${s.can_win_next_race ? 'var(--accent-green)' : 'var(--text-muted)'}`,
                    background: s.can_win_next_race ? 'var(--accent-green-light)' : 'transparent',
                  }}>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div>
                        <span className="font-semibold text-sm">{s.driver_name}</span>
                        <span className="text-muted text-xs" style={{ marginLeft: 6 }}>#{s.driver_number}</span>
                        <span className="text-xs" style={{ color: s.team_color, marginLeft: 4 }}>■ {s.team_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{s.current_points} pts</span>
                        {s.can_win_next_race && <span className="badge badge-green">Can clinch!</span>}
                      </div>
                    </div>
                    <p className="text-sm text-secondary" style={{ lineHeight: 1.5 }}>
                      {s.scenario_description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .champ-header { border-left: 4px solid var(--accent); }
        .champ-title { font-size: 1.7rem; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.02em; }
        .champ-desc { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 14px; max-width: 600px; line-height: 1.6; }
        .champ-meta { display: flex; gap: 20px; flex-wrap: wrap; font-size: 0.85rem; color: var(--text-muted); }
        .next-race-card { border-left: 3px solid var(--accent); }
        .next-race-info { background: var(--bg-secondary); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 4px; }
        .scenario-card { border-radius: var(--radius-sm); padding: 14px; border: 1px solid var(--border); }
        .race-item {
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 8px;
          border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px;
        }
        .rules-text { white-space: pre-wrap; color: var(--text-secondary); font-size: 0.85rem; font-family: var(--font); line-height: 1.7; }
        .pos-indicator { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; font-weight: 700; }
        .pos-indicator.gold { color: var(--accent-gold); }
        .pos-indicator.podium { color: var(--accent-green); }
        .team-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
        .driver-link { color: var(--text); }
        .driver-link:hover { color: var(--accent); }
        @media (max-width: 600px) {
          .champ-title { font-size: 1.3rem; }
          .champ-meta { gap: 12px; font-size: 0.8rem; }
        }
      `}</style>
    </div>
  );
}

function PositionIndicator({ current, previous }: { current: number; previous: number }) {
  if (!previous || previous === 0) return <span className="position-same text-xs" style={{ marginLeft: 2 }}>–</span>;
  if (current < previous) return <span className="position-up text-xs" style={{ marginLeft: 2 }}>▲{previous - current}</span>;
  if (current > previous) return <span className="position-down text-xs" style={{ marginLeft: 2 }}>▼{current - previous}</span>;
  return <span className="position-same text-xs" style={{ marginLeft: 2 }}>–</span>;
}
