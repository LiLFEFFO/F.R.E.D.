import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function AdminChampionship() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const uploadImage = async (file: File, callback: (url: string) => void) => {
    try { const { url } = await api.upload(file); callback(url); } catch {}
  };
  const [champ, setChamp] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'drivers' | 'teams' | 'races' | 'scoring'>('overview');

  const loadData = async () => {
    if (!id) return;
    try {
      const [c, d, t, r] = await Promise.all([
        api.championships.get(id),
        api.drivers.list({ championship_id: id }),
        api.teams.list(id),
        api.races.list(id),
      ]);
      setChamp(c);
      setDrivers(d);
      setTeams(t);
      setRaces(r);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  const [showAddDriver, setShowAddDriver] = useState(false);
  const [driverForm, setDriverForm] = useState({ name: '', number: 0, team_id: '' });

  const addDriver = async () => {
    if (!driverForm.name || !driverForm.number) return;
    await api.drivers.create({ championship_id: id, ...driverForm, team_id: driverForm.team_id || null });
    setShowAddDriver(false);
    setDriverForm({ name: '', number: 0, team_id: '' });
    loadData();
  };

  const deleteDriver = async (driverId: string) => {
    if (confirm('Delete this driver?')) {
      await api.drivers.delete(driverId);
      loadData();
    }
  };

  const [showAddTeam, setShowAddTeam] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', color: '#2563eb', logo: '', livery: '' });

  const addTeam = async () => {
    if (!teamForm.name) return;
    await api.teams.create({ championship_id: id, ...teamForm });
    setShowAddTeam(false);
    setTeamForm({ name: '', color: '#2563eb', logo: '', livery: '' });
    loadData();
  };

  const deleteTeam = async (teamId: string) => {
    if (confirm('Delete this team?')) {
      await api.teams.delete(teamId);
      loadData();
    }
  };

  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [editTeamForm, setEditTeamForm] = useState({ name: '', color: '#2563eb', logo: '', livery: '' });

  const saveTeamEdit = async () => {
    if (!editingTeam) return;
    await api.teams.update(editingTeam.id, editTeamForm);
    setEditingTeam(null);
    loadData();
  };

  const [showAddRace, setShowAddRace] = useState(false);
  const [raceForm, setRaceForm] = useState({ name: '', circuit: '', date: '', weather: 'Dry' });

  const addRace = async () => {
    if (!raceForm.name || !raceForm.circuit || !raceForm.date) return;
    await api.races.create({ championship_id: id, ...raceForm });
    setShowAddRace(false);
    setRaceForm({ name: '', circuit: '', date: '', weather: 'Dry' });
    loadData();
  };

  const deleteRace = async (raceId: string) => {
    if (confirm('Delete this race?')) {
      await api.races.delete(raceId);
      loadData();
    }
  };

  const [selectedRace, setSelectedRace] = useState<string | null>(null);
  const [resultEntries, setResultEntries] = useState<any[]>([]);

  const openResultForm = async (raceId: string) => {
    setSelectedRace(raceId);
    const race = races.find(r => r.id === raceId);
    if (race?.status === 'completed') {
      const fullRace = await api.races.get(raceId);
      if (fullRace.results?.length > 0) {
        setResultEntries(fullRace.results.map((r: any) => ({
          driver_id: r.driver_id,
          position: r.position,
          pole_position: !!r.pole_position,
          fastest_lap: !!r.fastest_lap,
          dnf: !!r.dnf,
          qualifying_position: r.qualifying_position != null ? r.qualifying_position : '',
          penalties: r.penalties || '',
          notes: r.notes || '',
        })));
        return;
      }
    }
    if (drivers.length > 0) {
      setResultEntries(
        drivers.map((d, i) => ({
          driver_id: d.id,
          position: i + 1,
          pole_position: false,
          fastest_lap: false,
          dnf: false,
          qualifying_position: '',
          penalties: '',
          notes: '',
        }))
      );
    }
  };

  const submitResults = async () => {
    if (!selectedRace) return;
    await api.races.submitResults(selectedRace, resultEntries);
    setSelectedRace(null);
    loadData();
  };

  const [showScoring, setShowScoring] = useState(false);
  const [scoringForm, setScoringForm] = useState<any>(null);

  const saveScoring = async () => {
    if (!scoringForm) return;
    await api.championships.updateScoring(id!, scoringForm);
    setShowScoring(false);
    loadData();
  };

  if (loading) return <div className="page"><div className="loading"><div className="spinner" /></div></div>;
  if (!champ) return <div className="page"><div className="empty-state"><h3>Not authorized or not found</h3></div></div>;

  return (
    <div className="page">
      <div className="container">
        <Link to="/admin" style={{ color: 'var(--text-secondary)', marginBottom: 12, display: 'inline-block', fontSize: '0.85rem' }}>
          ← Back to dashboard
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{champ.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{champ.season}</p>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
          <button className={`tab ${tab === 'drivers' ? 'active' : ''}`} onClick={() => setTab('drivers')}>Drivers</button>
          <button className={`tab ${tab === 'teams' ? 'active' : ''}`} onClick={() => setTab('teams')}>Teams</button>
          <button className={`tab ${tab === 'races' ? 'active' : ''}`} onClick={() => setTab('races')}>Races</button>
          <button className={`tab ${tab === 'scoring' ? 'active' : ''}`} onClick={() => setTab('scoring')}>Scoring</button>
        </div>

        {tab === 'overview' && (
          <>
            <div className="grid grid-4" style={{ marginBottom: 20 }}>
              <div className="stat-card"><div className="value">{drivers.length}</div><div className="label">Drivers</div></div>
              <div className="stat-card"><div className="value">{teams.length}</div><div className="label">Teams</div></div>
              <div className="stat-card"><div className="value">{races.length}</div><div className="label">Races</div></div>
              <div className="stat-card"><div className="value">{races.filter((r: any) => r.status === 'completed').length}</div><div className="label">Completed</div></div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Edit Series</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input placeholder="Name" defaultValue={champ.name} id="edit-name" />
                <textarea placeholder="Description" defaultValue={champ.description} id="edit-desc" />
                <textarea placeholder="Regulations" defaultValue={champ.rules} id="edit-rules" style={{ minHeight: 100 }} />
                <input type="number" placeholder="Max participants" defaultValue={champ.max_participants} id="edit-max" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={async () => {
                    await api.championships.update(id!, {
                      name: (document.getElementById('edit-name') as HTMLInputElement).value,
                      description: (document.getElementById('edit-desc') as HTMLTextAreaElement).value,
                      rules: (document.getElementById('edit-rules') as HTMLTextAreaElement).value,
                      max_participants: parseInt((document.getElementById('edit-max') as HTMLInputElement).value),
                    });
                    loadData();
                  }}>Save Changes</button>
                  <button className="btn btn-ghost" onClick={async () => {
                    if (confirm(champ.status === 'concluded' ? 'Reopen this series?' : 'Conclude this series? This will mark it as finished.')) {
                      await api.championships.conclude(id!);
                      loadData();
                    }
                  }}>
                    {champ.status === 'concluded' ? 'Reopen Series' : 'Conclude Series'}
                  </button>
                </div>
                <button className="btn btn-danger" onClick={async () => {
                  if (confirm('Delete this series permanently? All data will be lost.')) {
                    await api.championships.delete(id!);
                    navigate('/admin');
                  }
                }}>Delete Series</button>
              </div>
            </div>
          </>
        )}

        {tab === 'drivers' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Drivers</span>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddDriver(true)}>+ Add Driver</button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>#</th><th>Name</th><th>Team</th><th></th></tr>
                </thead>
                <tbody>
                  {drivers.map(d => (
                    <tr key={d.id}>
                      <td>#{d.number}</td>
                      <td style={{ fontWeight: 500 }}>{d.name}</td>
                      <td><span style={{ color: d.team_color }}>■</span> {d.team_name || '-'}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => deleteDriver(d.id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'teams' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Teams</span>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddTeam(true)}>+ Add Team</button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Logo</th><th>Name</th><th>Color</th><th>Livery</th><th>Drivers</th><th></th></tr>
                </thead>
                <tbody>
                  {teams.map((t: any) => (
                    <tr key={t.id}>
                      <td>
                        {t.logo ? (
                          <img src={t.logo} alt={t.name} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 4 }}
                            onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>}
                      </td>
                      <td style={{ fontWeight: 500 }}><span style={{ color: t.color }}>■</span> {t.name}</td>
                      <td><input type="color" value={t.color} disabled style={{ width: 36, height: 26, padding: 2, cursor: 'default' }} /></td>
                      <td>
                        {t.livery ? (
                          <img src={t.livery} alt={`${t.name} livery`} style={{ width: 60, height: 36, objectFit: 'cover', borderRadius: 4 }}
                            onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>}
                      </td>
                      <td>{t.driver_count || 0}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditingTeam(t); setEditTeamForm({ name: t.name, color: t.color, logo: t.logo || '', livery: t.livery || '' }); }}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteTeam(t.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'races' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Races</span>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddRace(true)}>+ Add Race</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {races.map((r: any) => (
                <div key={r.id} style={{
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 12,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6
                }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>{r.name}</strong>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: '0.8rem' }}>{r.circuit}</span>
                    <span className={`badge ${r.status === 'completed' ? 'badge-green' : r.status === 'in_progress' ? 'badge-orange' : 'badge-blue'}`} style={{ marginLeft: 6 }}>
                      {r.status === 'completed' ? 'Done' : r.status === 'in_progress' ? 'Live' : 'Scheduled'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openResultForm(r.id)} disabled={drivers.length === 0}>
                      {r.status === 'completed' ? 'Edit results' : 'Enter results'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteRace(r.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'scoring' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Scoring System</span>
              <button className="btn btn-primary btn-sm" onClick={() => {
                if (champ.scoring) setScoringForm({ position_points: JSON.parse(champ.scoring.position_points), pole_bonus: champ.scoring.pole_bonus, fastest_lap_bonus: champ.scoring.fastest_lap_bonus });
                else setScoringForm({ position_points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1], pole_bonus: 0, fastest_lap_bonus: 0 });
                setShowScoring(true);
              }}>Edit</button>
            </div>
            {champ.scoring && (
              <div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 6, fontSize: '0.85rem' }}>
                  Points per position: <strong>[{JSON.parse(champ.scoring.position_points).join(', ')}]</strong>
                </p>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 6, fontSize: '0.85rem' }}>
                  Pole Position bonus: <strong>{champ.scoring.pole_bonus} pts</strong>
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Fastest Lap bonus: <strong>{champ.scoring.fastest_lap_bonus} pts</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {showAddDriver && (
          <Modal onClose={() => setShowAddDriver(false)} title="Add Driver">
            <input placeholder="Driver name" value={driverForm.name} onChange={e => setDriverForm(f => ({ ...f, name: e.target.value }))} />
            <input type="number" placeholder="Number" value={driverForm.number || ''} onChange={e => setDriverForm(f => ({ ...f, number: parseInt(e.target.value) || 0 }))} />
            <select value={driverForm.team_id} onChange={e => setDriverForm(f => ({ ...f, team_id: e.target.value }))}>
              <option value="">No team</option>
              {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button className="btn btn-primary" onClick={addDriver}>Add</button>
          </Modal>
        )}

          {showAddTeam && (
          <Modal onClose={() => setShowAddTeam(false)} title="Add Team">
            <input placeholder="Team name" value={teamForm.name} onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))} />
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Color</label>
              <input type="color" value={teamForm.color} onChange={e => setTeamForm(f => ({ ...f, color: e.target.value }))} style={{ height: 36, padding: 3 }} />
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Logo</label>
              <input type="file" accept="image/*" onChange={async e => {
                const f = e.target.files?.[0]; if (!f) return;
                try { const { url } = await api.upload(f); setTeamForm(t => ({ ...t, logo: url })); } catch {}
              }} />
              {(teamForm as any).logo && <span style={{ fontSize: '0.78rem', color: 'var(--accent-green)' }}>✓ Logo uploaded</span>}
            </div>
            <button className="btn btn-primary" onClick={addTeam}>Add</button>
          </Modal>
        )}

        {editingTeam && (
          <Modal onClose={() => setEditingTeam(null)} title="Edit Team">
            <input placeholder="Team name" value={editTeamForm.name} onChange={e => setEditTeamForm(f => ({ ...f, name: e.target.value }))} />
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Color</label>
              <input type="color" value={editTeamForm.color} onChange={e => setEditTeamForm(f => ({ ...f, color: e.target.value }))} style={{ height: 36, padding: 3 }} />
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Logo</label>
              {editTeamForm.logo && (
                <img src={editTeamForm.logo} alt="logo" style={{ width: 60, height: 60, objectFit: 'contain', display: 'block', marginBottom: 4, borderRadius: 4 }}
                  onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
              )}
              <input type="file" accept="image/*" onChange={async e => {
                const f = e.target.files?.[0]; if (!f) return;
                try { const { url } = await api.upload(f); setEditTeamForm(t => ({ ...t, logo: url })); } catch {}
              }} />
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Car Livery</label>
              {editTeamForm.livery && (
                <img src={editTeamForm.livery} alt="livery" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', display: 'block', marginBottom: 4, borderRadius: 'var(--radius-sm)' }}
                  onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
              )}
              <input type="file" accept="image/*" onChange={async e => {
                const f = e.target.files?.[0]; if (!f) return;
                try { const { url } = await api.upload(f); setEditTeamForm(t => ({ ...t, livery: url })); } catch {}
              }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => setEditingTeam(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveTeamEdit}>Save</button>
            </div>
          </Modal>
        )}

        {showAddRace && (
          <Modal onClose={() => setShowAddRace(false)} title="Add Race">
            <input placeholder="Race name" value={raceForm.name} onChange={e => setRaceForm(f => ({ ...f, name: e.target.value }))} />
            <input placeholder="Circuit" value={raceForm.circuit} onChange={e => setRaceForm(f => ({ ...f, circuit: e.target.value }))} />
            <input type="date" value={raceForm.date} onChange={e => setRaceForm(f => ({ ...f, date: e.target.value }))} />
            <select value={raceForm.weather} onChange={e => setRaceForm(f => ({ ...f, weather: e.target.value }))}>
              <option value="Dry">Dry</option>
              <option value="Wet">Wet</option>
              <option value="Mixed">Mixed</option>
            </select>
            <button className="btn btn-primary" onClick={addRace}>Add</button>
          </Modal>
        )}

        {showScoring && scoringForm && (
          <Modal onClose={() => setShowScoring(false)} title="Edit Scoring" wide>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 8 }}>
              Points awarded per finishing position. Leave empty or 0 for positions beyond the grid.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {scoringForm.position_points.map((pts: number, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', minWidth: 60 }}>P{i + 1}</label>
                  <input type="number" value={pts} style={{ width: 70, padding: '5px 8px', fontSize: '0.85rem' }}
                    onChange={e => {
                      const newArr = [...scoringForm.position_points];
                      newArr[i] = parseInt(e.target.value) || 0;
                      setScoringForm((f: any) => ({ ...f, position_points: newArr }));
                    }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', display: 'block', marginBottom: 4 }}>Pole Bonus</label>
                <input type="number" value={scoringForm.pole_bonus} onChange={e => setScoringForm((f: any) => ({ ...f, pole_bonus: parseInt(e.target.value) || 0 }))}
                  style={{ width: 80, padding: '5px 8px', fontSize: '0.85rem' }} />
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', display: 'block', marginBottom: 4 }}>Fastest Lap Bonus</label>
                <input type="number" value={scoringForm.fastest_lap_bonus} onChange={e => setScoringForm((f: any) => ({ ...f, fastest_lap_bonus: parseInt(e.target.value) || 0 }))}
                  style={{ width: 80, padding: '5px 8px', fontSize: '0.85rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => setShowScoring(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveScoring}>Save</button>
            </div>
          </Modal>
        )}

        {selectedRace && (
          <Modal onClose={() => setSelectedRace(null)} title="Enter Results" wide>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 10, fontSize: '0.85rem' }}>
              Set the finishing order and qualifying positions. Only one driver can have the fastest lap.
            </p>
            <div className="table-wrapper" style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr><th>Race Pos</th><th>Driver</th><th>Qualifying Pos</th><th>Pole</th><th>FL</th><th>DNF</th><th>Penalties</th></tr>
                </thead>
                <tbody>
                  {resultEntries.sort((a, b) => a.position - b.position).map((entry, idx) => (
                    <tr key={entry.driver_id}>
                      <td>
                        <input type="number" value={entry.position}
                          onChange={e => {
                            const newPos = parseInt(e.target.value) || 1;
                            setResultEntries((prev: any[]) =>
                              prev.map((p: any) => p.driver_id === entry.driver_id ? { ...p, position: newPos } : p)
                            );
                          }}
                          style={{ width: 50, padding: '4px 6px', fontSize: '0.85rem' }}
                        />
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{drivers.find(d => d.id === entry.driver_id)?.name || entry.driver_id}</td>
                      <td>
                        <input type="number" value={entry.qualifying_position}
                          onChange={e => {
                            const val = e.target.value;
                            setResultEntries((prev: any[]) =>
                              prev.map((p: any) => p.driver_id === entry.driver_id ? { ...p, qualifying_position: val === '' ? '' : parseInt(val) || 1 } : p)
                            );
                          }}
                          style={{ width: 50, padding: '4px 6px', fontSize: '0.85rem' }}
                          placeholder="—"
                        />
                      </td>
                      <td><input type="checkbox" checked={entry.pole_position} onChange={e => {
                        setResultEntries((prev: any[]) =>
                          prev.map((p: any) => p.driver_id === entry.driver_id ? { ...p, pole_position: e.target.checked } : p)
                        );
                      }} /></td>
                      <td>
                        <input type="radio" name={`fl-${selectedRace}`} checked={entry.fastest_lap}
                          onChange={() => {
                            setResultEntries((prev: any[]) =>
                              prev.map((p: any) => ({ ...p, fastest_lap: p.driver_id === entry.driver_id }))
                            );
                          }} />
                      </td>
                      <td><input type="checkbox" checked={entry.dnf} onChange={e => {
                        setResultEntries((prev: any[]) =>
                          prev.map((p: any) => p.driver_id === entry.driver_id ? { ...p, dnf: e.target.checked } : p)
                        );
                      }} /></td>
                      <td><input value={entry.penalties} onChange={e => {
                        setResultEntries((prev: any[]) =>
                          prev.map((p: any) => p.driver_id === entry.driver_id ? { ...p, penalties: e.target.value } : p)
                        );
                      }} style={{ width: 90, padding: '4px 6px', fontSize: '0.85rem' }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn-ghost" onClick={() => setSelectedRace(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitResults}>Save Results</button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}

function Modal({ children, onClose, title, wide }: { children: React.ReactNode; onClose: () => void; title: string; wide?: boolean }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width: wide ? 650 : 420, maxWidth: '100%', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{title}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
