import React, { useState, useEffect, useMemo } from 'react';
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
    try { setChamp(await api.championships.get(id)); } catch {}
    try { setDrivers(await api.drivers.list({ championship_id: id })); } catch {}
    try { setTeams(await api.teams.list(id)); } catch {}
    try { setRaces(await api.races.list(id)); } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); loadCollaborators(); }, [id]);

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
  const [teamForm, setTeamForm] = useState({ name: '', color: '#4f46e5', logo: '', livery: '', reserve_driver_id: '' });

  const addTeam = async () => {
    if (!teamForm.name) return;
    await api.teams.create({ championship_id: id, ...teamForm, reserve_driver_id: teamForm.reserve_driver_id || null });
    setShowAddTeam(false);
    setTeamForm({ name: '', color: '#4f46e5', logo: '', livery: '', reserve_driver_id: '' });
    loadData();
  };

  const deleteTeam = async (teamId: string) => {
    if (confirm('Delete this team?')) {
      await api.teams.delete(teamId);
      loadData();
    }
  };

  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [editTeamForm, setEditTeamForm] = useState({ name: '', color: '#4f46e5', logo: '', livery: '', reserve_driver_id: '' });

  const saveTeamEdit = async () => {
    if (!editingTeam) return;
    await api.teams.update(editingTeam.id, { ...editTeamForm, reserve_driver_id: editTeamForm.reserve_driver_id || null });
    setEditingTeam(null);
    loadData();
  };

  const [showAddRace, setShowAddRace] = useState(false);
  const [raceForm, setRaceForm] = useState({ name: '', circuit: '', date: '', weather: 'Dry', has_sprint: false });

  const addRace = async () => {
    if (!raceForm.name || !raceForm.circuit || !raceForm.date) return;
    await api.races.create({ championship_id: id, ...raceForm, has_sprint: raceForm.has_sprint });
    setShowAddRace(false);
    setRaceForm({ name: '', circuit: '', date: '', weather: 'Dry', has_sprint: false });
    loadData();
  };

  const deleteRace = async (raceId: string) => {
    if (confirm('Delete this race?')) {
      await api.races.delete(raceId);
      loadData();
    }
  };

  const [selectedRace, setSelectedRace] = useState<string | null>(null);
  const [resultsTab, setResultsTab] = useState<'race' | 'sprint' | 'qualifying'>('race');
  const [raceSelections, setRaceSelections] = useState<Record<number, string>>({});
  const [raceExtras, setRaceExtras] = useState<Record<string, { pole: boolean; fl: boolean; dnf: boolean; present: boolean; penalties: string }>>({});
  const [sprintSelections, setSprintSelections] = useState<Record<number, string>>({});
  const [sprintExtras, setSprintExtras] = useState<Record<string, { dnf: boolean; present: boolean; penalties: string }>>({});
  const [qualifyingSelections, setQualifyingSelections] = useState<Record<number, string>>({});
  const [qualifyingExtras, setQualifyingExtras] = useState<Record<string, { penalties: string }>>({});

  const selectedRaceData = useMemo(() => races.find(r => r.id === selectedRace), [selectedRace, races]);

  const usedDriverIds = (selections: Record<number, string>, skipPos?: number) =>
    Object.entries(selections).filter(([k, v]) => Number(k) !== skipPos && v).map(([, v]) => v);

  const availableDrivers = (selections: Record<number, string>, currentPos: number) =>
    drivers.filter(d => !usedDriverIds(selections, currentPos).includes(d.id));

  const initRaceForm = (race: any) => {
    const totalPos = drivers.length;
    const initSelections: Record<number, string> = {};
    const initExtras: Record<string, any> = {};
    for (let i = 1; i <= totalPos; i++) initSelections[i] = '';
    drivers.forEach(d => { initExtras[d.id] = { pole: false, fl: false, dnf: false, present: true, penalties: '' }; });
    setRaceSelections(initSelections);
    setRaceExtras(initExtras);
    const initSprintSelections: Record<number, string> = {};
    const initSprintExtras: Record<string, any> = {};
    if (race?.has_sprint) {
      for (let i = 1; i <= totalPos; i++) initSprintSelections[i] = '';
      drivers.forEach(d => { initSprintExtras[d.id] = { fl: false, dnf: false, present: true, penalties: '' }; });
    }
    setSprintSelections(initSprintSelections);
    setSprintExtras(initSprintExtras);
    const initQSelections: Record<number, string> = {};
    const initQExtras: Record<string, any> = {};
    for (let i = 1; i <= totalPos; i++) initQSelections[i] = '';
    drivers.forEach(d => { initQExtras[d.id] = { penalties: '' }; });
    setQualifyingSelections(initQSelections);
    setQualifyingExtras(initQExtras);
  };

  const [editingRace, setEditingRace] = useState<any>(null);
  const [editRaceForm, setEditRaceForm] = useState({ name: '', circuit: '', date: '', weather: 'Dry', has_sprint: false });

  const saveRaceEdit = async () => {
    if (!editingRace) return;
    await api.races.update(editingRace.id, editRaceForm);
    setEditingRace(null);
    loadData();
  };

  const openResultForm = async (raceId: string) => {
    setSelectedRace(raceId);
    setResultsTab('race');
    const race = races.find(r => r.id === raceId);
    if (!race) return;
    if (race.status === 'completed') {
      const fullRace = await api.races.get(raceId);
      const totalPos = drivers.length;
      const raceSel: Record<number, string> = {};
      const raceEx: Record<string, any> = {};
      for (let i = 1; i <= totalPos; i++) raceSel[i] = '';
      drivers.forEach(d => { raceEx[d.id] = { pole: false, fl: false, dnf: false, present: true, penalties: '' }; });
      if (fullRace.results?.length > 0) {
        for (const r of fullRace.results) {
          raceSel[r.position] = r.driver_id;
          raceEx[r.driver_id] = {
            pole: !!r.pole_position,
            fl: !!r.fastest_lap,
            dnf: !!r.dnf,
            present: r.present !== 0,
            penalties: r.penalties || '',
          };
        }
      }
      setRaceSelections(raceSel);
      setRaceExtras(raceEx);

      const sprintSel: Record<number, string> = {};
      const sprintEx: Record<string, any> = {};
      for (let i = 1; i <= totalPos; i++) sprintSel[i] = '';
      drivers.forEach(d => { sprintEx[d.id] = { fl: false, dnf: false, present: true, penalties: '' }; });
      if (fullRace.sprint_results?.length > 0) {
        for (const r of fullRace.sprint_results) {
          sprintSel[r.position] = r.driver_id;
          sprintEx[r.driver_id] = { fl: !!r.fastest_lap, dnf: !!r.dnf, present: r.present !== 0, penalties: r.penalties || '' };
        }
      }
      setSprintSelections(sprintSel);
      setSprintExtras(sprintEx);

      const qSel: Record<number, string> = {};
      const qEx: Record<string, any> = {};
      for (let i = 1; i <= totalPos; i++) qSel[i] = '';
      drivers.forEach(d => { qEx[d.id] = { penalties: '' }; });
      if (fullRace.results?.length > 0) {
        for (const r of fullRace.results) {
          if (r.qualifying_position != null) {
            qSel[r.qualifying_position] = r.driver_id;
          }
        }
      }
      setQualifyingSelections(qSel);
      setQualifyingExtras(qEx);
      return;
    }
    initRaceForm(race);
  };

  const submitResults = async () => {
    if (!selectedRace) return;
    const resultEntries = Object.entries(raceSelections)
      .filter(([, driverId]) => driverId)
      .map(([pos, driverId]) => ({
        driver_id: driverId,
        position: Number(pos),
        pole_position: raceExtras[driverId]?.pole || false,
        fastest_lap: raceExtras[driverId]?.fl || false,
        dnf: raceExtras[driverId]?.dnf || false,
        present: raceExtras[driverId]?.present !== false,
        qualifying_position: Object.entries(qualifyingSelections)
          .find(([, qd]) => qd === driverId)?.[0]
          ? Number(Object.entries(qualifyingSelections).find(([, qd]) => qd === driverId)![0])
          : null,
        penalties: raceExtras[driverId]?.penalties || '',
        notes: '',
      }));
    await api.races.submitResults(selectedRace, resultEntries);
    const race = races.find(r => r.id === selectedRace);
    if (race?.has_sprint && Object.values(sprintSelections).some(v => v)) {
      const sprintEntries = Object.entries(sprintSelections)
        .filter(([, driverId]) => driverId)
        .map(([pos, driverId]) => ({
          driver_id: driverId,
          position: Number(pos),
          fastest_lap: sprintExtras[driverId]?.fl || false,
          dnf: sprintExtras[driverId]?.dnf || false,
          present: sprintExtras[driverId]?.present !== false,
          penalties: sprintExtras[driverId]?.penalties || '',
          notes: '',
        }));
      await api.races.submitSprintResults(selectedRace, sprintEntries);
    }
    setSelectedRace(null);
    loadData();
  };

  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [eliteUsers, setEliteUsers] = useState<any[]>([]);
  const [showInviteCollab, setShowInviteCollab] = useState(false);
  const [selectedCollabUserId, setSelectedCollabUserId] = useState('');

  const loadCollaborators = async () => {
    if (!id) return;
    try { setCollaborators(await api.championships.getCollaborators(id)); } catch {}
    try { setEliteUsers(await api.admin.eliteUsers()); } catch {}
  };

  const inviteCollaborator = async () => {
    if (!id || !selectedCollabUserId) return;
    await api.championships.addCollaborator(id, selectedCollabUserId);
    setSelectedCollabUserId('');
    setShowInviteCollab(false);
    loadCollaborators();
  };

  const removeCollaborator = async (userId: string) => {
    if (!id) return;
    if (confirm('Remove this collaborator?')) {
      await api.championships.removeCollaborator(id, userId);
      loadCollaborators();
    }
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
        <Link to="/admin" className="btn btn-ghost btn-sm mb-4" style={{ display: 'inline-flex' }}>
          ← Back to dashboard
        </Link>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="section-title" style={{ marginBottom: 4, fontSize: '1.4rem' }}>{champ.name}</h1>
            <p className="text-sm text-secondary">{champ.season}</p>
          </div>
          <span className={`badge ${champ.status === 'active' ? 'badge-green' : 'badge-blue'}`}>
            {champ.status === 'active' ? 'Active' : 'Concluded'}
          </span>
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
            <div className="grid grid-4 mb-6">
              <div className="stat-card">
                <span className="stat-icon">👥</span>
                <div className="value">{drivers.length}</div>
                <div className="label">Drivers</div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🏢</span>
                <div className="value">{teams.length}</div>
                <div className="label">Teams</div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🏁</span>
                <div className="value">{races.length}</div>
                <div className="label">Races</div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">✅</span>
                <div className="value">{races.filter((r: any) => r.status === 'completed').length}</div>
                <div className="label">Completed</div>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-header">
                <span className="card-title">Collaborators</span>
                <button className="btn btn-primary btn-sm" onClick={() => { loadCollaborators(); setShowInviteCollab(true); }}>+ Invite Elite</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {collaborators.length === 0 ? (
                  <p className="text-sm text-muted p-3">No collaborators yet</p>
                ) : (
                  collaborators.map((c: any) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                      <div className="flex items-center gap-2">
                        <div className="avatar avatar-xs" style={{ background: 'var(--accent)', color: '#fff', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                          {c.username?.substring(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{c.username}</span>
                        <span className="text-xs text-muted">{c.email}</span>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => removeCollaborator(c.user_id)}>Remove</button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {showInviteCollab && (
              <Modal onClose={() => setShowInviteCollab(false)} title="Invite Elite User">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <select value={selectedCollabUserId} onChange={e => setSelectedCollabUserId(e.target.value)}>
                    <option value="">— Select user —</option>
                    {eliteUsers.filter((u: any) => !collaborators.find((c: any) => c.user_id === u.id)).map((u: any) => (
                      <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                    ))}
                  </select>
                  <div className="flex justify-between mt-2">
                    <button className="btn btn-ghost" onClick={() => setShowInviteCollab(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={inviteCollaborator} disabled={!selectedCollabUserId}>Invite</button>
                  </div>
                </div>
              </Modal>
            )}

            <div className="card">
              <div className="card-header"><span className="card-title">Edit Series</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input placeholder="Name" defaultValue={champ.name} id="edit-name" />
                <textarea placeholder="Description" defaultValue={champ.description} id="edit-desc" />
                <textarea placeholder="Regulations" defaultValue={champ.rules} id="edit-rules" style={{ minHeight: 100 }} />
                <input type="number" placeholder="Max participants" defaultValue={champ.max_participants} id="edit-max" />
                <div className="flex gap-3 flex-wrap">
                  <button className="btn btn-primary" onClick={async () => {
                    await api.championships.update(id!, {
                      name: (document.getElementById('edit-name') as HTMLInputElement).value,
                      description: (document.getElementById('edit-desc') as HTMLTextAreaElement).value,
                      rules: (document.getElementById('edit-rules') as HTMLTextAreaElement).value,
                      max_participants: parseInt((document.getElementById('edit-max') as HTMLInputElement).value),
                    });
                    loadData();
                  }}>Save Changes</button>
                  <button className="btn btn-secondary" onClick={async () => {
                    if (confirm(champ.status === 'concluded' ? 'Reopen this series?' : 'Conclude this series? This will mark it as finished.')) {
                      await api.championships.conclude(id!);
                      loadData();
                    }
                  }}>
                    {champ.status === 'concluded' ? 'Reopen Series' : 'Conclude Series'}
                  </button>
                  <button className="btn btn-secondary" onClick={async () => {
                    await api.championships.recalculate(id!);
                    loadData();
                  }}>Recalculate Standings</button>
                  <button className="btn btn-danger" onClick={async () => {
                    if (confirm('Delete this series permanently? All data will be lost.')) {
                      await api.championships.delete(id!);
                      navigate('/admin');
                    }
                  }}>Delete Series</button>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'drivers' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Drivers ({drivers.length})</span>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddDriver(true)}>+ Add Driver</button>
            </div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr><th>#</th><th>Name</th><th>Team</th><th></th></tr>
                </thead>
                <tbody>
                  {drivers.map(d => (
                    <tr key={d.id}>
                      <td className="font-bold">#{d.number}</td>
                      <td style={{ fontWeight: 500 }}>{d.name}</td>
                      <td>
                        <span className="team-dot" style={{ background: d.team_color || 'var(--text-muted)' }} />
                        <select value={d.team_id || ''} onChange={async e => {
                          const newTeamId = e.target.value;
                          await api.drivers.update(d.id, { team_id: newTeamId || null });
                          loadData();
                        }} style={{ padding: '2px 4px', fontSize: '0.8rem', maxWidth: 140 }}>
                          <option value="">— No team —</option>
                          {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </td>
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
              <span className="card-title">Teams ({teams.length})</span>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddTeam(true)}>+ Add Team</button>
            </div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr><th>Logo</th><th>Name</th><th>Color</th><th>Livery</th><th>Drivers</th><th>Reserve</th><th></th></tr>
                </thead>
                <tbody>
                  {teams.map((t: any) => (
                    <tr key={t.id}>
                      <td>
                        {t.logo ? (
                          <img src={t.logo} alt={t.name} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 4 }}
                            onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                        ) : <span className="text-muted text-xs">—</span>}
                      </td>
                      <td style={{ fontWeight: 500 }}><span className="team-dot" style={{ background: t.color }} />{t.name}</td>
                      <td><input type="color" value={t.color} disabled style={{ width: 36, height: 26, padding: 2, cursor: 'default', borderRadius: 4 }} /></td>
                      <td>
                        {t.livery ? (
                          <img src={t.livery} alt={`${t.name} livery`} style={{ width: 60, height: 36, objectFit: 'cover', borderRadius: 4 }}
                            onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                        ) : <span className="text-muted text-xs">—</span>}
                      </td>
                      <td>{t.driver_count || 0}</td>
                      <td className="text-sm text-secondary">{t.reserve_driver_name || '—'}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditingTeam(t); setEditTeamForm({ name: t.name, color: t.color, logo: t.logo || '', livery: t.livery || '', reserve_driver_id: t.reserve_driver_id || '' }); }}>Edit</button>
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
              <span className="card-title">Races ({races.length})</span>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddRace(true)}>+ Add Race</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {races.map((r: any) => (
                <div key={r.id} className="race-item" style={{
                  background: r.status === 'completed' ? 'var(--accent-green-light)' : r.status === 'in_progress' ? 'var(--accent-orange-light)' : 'transparent'
                }}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <strong className="text-sm">{r.name}</strong>
                    <span className="text-muted text-xs">{r.circuit}</span>
                    <span className={`badge ${r.status === 'completed' ? 'badge-green' : r.status === 'in_progress' ? 'badge-orange' : 'badge-blue'}`}>
                      {r.status === 'completed' ? 'Done' : r.status === 'in_progress' ? 'Live' : 'Scheduled'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-primary btn-sm" onClick={() => openResultForm(r.id)} disabled={drivers.length === 0}>
                      {r.status === 'completed' ? 'Edit results' : 'Enter results'}
                    </button>
                    {r.status === 'completed' && (
                      <button className="btn btn-secondary btn-sm" onClick={async () => {
                        if (confirm('Re-open this race? Results will be cleared.')) {
                          await api.races.reopen(r.id);
                          loadData();
                        }
                      }}>Re-open</button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => {
                      setEditRaceForm({ name: r.name, circuit: r.circuit, date: r.date, weather: r.weather, has_sprint: !!r.has_sprint });
                      setEditingRace(r);
                    }}>Edit</button>
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
                if (champ.scoring) setScoringForm({ position_points: JSON.parse(champ.scoring.position_points), sprint_points: JSON.parse(champ.scoring.sprint_points || '[10,8,6,5,4,3,2,1]'), pole_bonus: champ.scoring.pole_bonus, fastest_lap_bonus: champ.scoring.fastest_lap_bonus });
                else setScoringForm({ position_points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1], sprint_points: [10, 8, 6, 5, 4, 3, 2, 1], pole_bonus: 0, fastest_lap_bonus: 0 });
                setShowScoring(true);
              }}>Edit</button>
            </div>
            {champ.scoring && (
              <div className="text-sm text-secondary" style={{ lineHeight: 1.8 }}>
                <p>Race points per position: <strong className="text-accent">[{JSON.parse(champ.scoring.position_points).join(', ')}]</strong></p>
                <p>Sprint points per position: <strong className="text-accent">[{JSON.parse(champ.scoring.sprint_points || '[10,8,6,5,4,3,2,1]').join(', ')}]</strong></p>
                <p>Pole Position bonus: <strong>{champ.scoring.pole_bonus} pts</strong></p>
                <p>Fastest Lap bonus: <strong>{champ.scoring.fastest_lap_bonus} pts</strong></p>
              </div>
            )}
          </div>
        )}

        {showAddDriver && (
          <Modal onClose={() => setShowAddDriver(false)} title="Add Driver">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Driver name" value={driverForm.name} onChange={e => setDriverForm(f => ({ ...f, name: e.target.value }))} />
              <input type="number" placeholder="Number" value={driverForm.number || ''} onChange={e => setDriverForm(f => ({ ...f, number: parseInt(e.target.value) || 0 }))} />
              <select value={driverForm.team_id} onChange={e => setDriverForm(f => ({ ...f, team_id: e.target.value }))}>
                <option value="">No team</option>
                {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button className="btn btn-primary" onClick={addDriver}>Add Driver</button>
            </div>
          </Modal>
        )}

        {showAddTeam && (
          <Modal onClose={() => setShowAddTeam(false)} title="Add Team">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Team name" value={teamForm.name} onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))} />
              <div>
                <label className="form-label">Color</label>
                <input type="color" value={teamForm.color} onChange={e => setTeamForm(f => ({ ...f, color: e.target.value }))} style={{ height: 36, padding: 3 }} />
              </div>
              <div>
                <label className="form-label">Reserve Driver</label>
                <select value={teamForm.reserve_driver_id} onChange={e => setTeamForm(f => ({ ...f, reserve_driver_id: e.target.value }))}>
                  <option value="">No reserve</option>
                  {drivers.filter(d => !d.team_id || d.team_id === '').map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Logo</label>
                <input type="file" accept="image/*" onChange={async e => {
                  const f = e.target.files?.[0]; if (!f) return;
                  try { const { url } = await api.upload(f); setTeamForm(t => ({ ...t, logo: url })); } catch {}
                }} />
                {(teamForm as any).logo && <span className="badge badge-green mt-1">Logo uploaded</span>}
              </div>
              <button className="btn btn-primary" onClick={addTeam}>Add Team</button>
            </div>
          </Modal>
        )}

        {editingTeam && (
          <Modal onClose={() => setEditingTeam(null)} title="Edit Team">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Team name" value={editTeamForm.name} onChange={e => setEditTeamForm(f => ({ ...f, name: e.target.value }))} />
              <div>
                <label className="form-label">Color</label>
                <input type="color" value={editTeamForm.color} onChange={e => setEditTeamForm(f => ({ ...f, color: e.target.value }))} style={{ height: 36, padding: 3 }} />
              </div>
              <div>
                <label className="form-label">Reserve Driver</label>
                <select value={editTeamForm.reserve_driver_id} onChange={e => setEditTeamForm(f => ({ ...f, reserve_driver_id: e.target.value }))}>
                  <option value="">No reserve</option>
                  {drivers.filter(d => !d.team_id || d.team_id === '').map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Logo</label>
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
                <label className="form-label">Car Livery</label>
                {editTeamForm.livery && (
                  <img src={editTeamForm.livery} alt="livery" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', display: 'block', marginBottom: 4, borderRadius: 'var(--radius-sm)' }}
                    onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                )}
                <input type="file" accept="image/*" onChange={async e => {
                  const f = e.target.files?.[0]; if (!f) return;
                  try { const { url } = await api.upload(f); setEditTeamForm(t => ({ ...t, livery: url })); } catch {}
                }} />
              </div>
              <div className="flex justify-between mt-2">
                <button className="btn btn-ghost" onClick={() => setEditingTeam(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveTeamEdit}>Save Changes</button>
              </div>
            </div>
          </Modal>
        )}

        {showAddRace && (
          <Modal onClose={() => setShowAddRace(false)} title="Add Race">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Race name" value={raceForm.name} onChange={e => setRaceForm(f => ({ ...f, name: e.target.value }))} />
              <input placeholder="Circuit" value={raceForm.circuit} onChange={e => setRaceForm(f => ({ ...f, circuit: e.target.value }))} />
              <input type="date" value={raceForm.date} onChange={e => setRaceForm(f => ({ ...f, date: e.target.value }))} />
              <select value={raceForm.weather} onChange={e => setRaceForm(f => ({ ...f, weather: e.target.value }))}>
                <option value="Dry">Dry</option>
                <option value="Wet">Wet</option>
                <option value="Mixed">Mixed</option>
              </select>
              <label className="result-checkbox" style={{ fontSize: '0.85rem' }}>
                <input type="checkbox" checked={raceForm.has_sprint}
                  onChange={e => setRaceForm(f => ({ ...f, has_sprint: e.target.checked }))} />
                Include Sprint race
              </label>
              <button className="btn btn-primary" onClick={addRace}>Add Race</button>
            </div>
          </Modal>
        )}

        {editingRace && (
          <Modal onClose={() => setEditingRace(null)} title="Edit Race">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Race name" value={editRaceForm.name} onChange={e => setEditRaceForm(f => ({ ...f, name: e.target.value }))} />
              <input placeholder="Circuit" value={editRaceForm.circuit} onChange={e => setEditRaceForm(f => ({ ...f, circuit: e.target.value }))} />
              <input type="date" value={editRaceForm.date} onChange={e => setEditRaceForm(f => ({ ...f, date: e.target.value }))} />
              <select value={editRaceForm.weather} onChange={e => setEditRaceForm(f => ({ ...f, weather: e.target.value }))}>
                <option value="Dry">Dry</option>
                <option value="Wet">Wet</option>
                <option value="Mixed">Mixed</option>
              </select>
              <label className="result-checkbox" style={{ fontSize: '0.85rem' }}>
                <input type="checkbox" checked={editRaceForm.has_sprint}
                  onChange={e => setEditRaceForm(f => ({ ...f, has_sprint: e.target.checked }))} />
                Include Sprint race
              </label>
              <div className="flex justify-between mt-2">
                <button className="btn btn-ghost" onClick={() => setEditingRace(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveRaceEdit}>Save Changes</button>
              </div>
            </div>
          </Modal>
        )}

        {showScoring && scoringForm && (
          <Modal onClose={() => setShowScoring(false)} title="Edit Scoring" wide>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p className="text-sm text-secondary">Points awarded per finishing position. Use +/- to add/remove scoring positions.</p>
              <h4 className="font-semibold text-sm mt-2 mb-1">Main Race Points</h4>
              <div className="scoring-grid">
                {scoringForm.position_points.map((pts: number, i: number) => (
                  <div key={i} className="scoring-item">
                    <label className="scoring-label">P{i + 1}</label>
                    <input type="number" value={pts} className="scoring-input"
                      onChange={e => {
                        const newArr = [...scoringForm.position_points];
                        newArr[i] = parseInt(e.target.value) || 0;
                        setScoringForm((f: any) => ({ ...f, position_points: newArr }));
                      }} />
                    {i === scoringForm.position_points.length - 1 && (
                      <button className="btn btn-ghost btn-sm" onClick={() => {
                        setScoringForm((f: any) => ({ ...f, position_points: [...f.position_points, 0] }));
                      }} style={{ padding: '2px 6px', fontSize: '0.78rem' }}>+</button>
                    )}
                    {scoringForm.position_points.length > 1 && i === scoringForm.position_points.length - 1 && (
                      <button className="btn btn-ghost btn-sm" onClick={() => {
                        setScoringForm((f: any) => ({ ...f, position_points: f.position_points.slice(0, -1) }));
                      }} style={{ padding: '2px 6px', fontSize: '0.78rem', color: 'var(--accent-red)' }}>−</button>
                    )}
                  </div>
                ))}
              </div>
              <h4 className="font-semibold text-sm mt-3 mb-1">Sprint Race Points</h4>
              <div className="scoring-grid">
                {scoringForm.sprint_points?.map((pts: number, i: number) => (
                  <div key={i} className="scoring-item">
                    <label className="scoring-label">P{i + 1}</label>
                    <input type="number" value={pts} className="scoring-input"
                      onChange={e => {
                        const newArr = [...scoringForm.sprint_points];
                        newArr[i] = parseInt(e.target.value) || 0;
                        setScoringForm((f: any) => ({ ...f, sprint_points: newArr }));
                      }} />
                    {i === scoringForm.sprint_points.length - 1 && (
                      <button className="btn btn-ghost btn-sm" onClick={() => {
                        setScoringForm((f: any) => ({ ...f, sprint_points: [...f.sprint_points, 0] }));
                      }} style={{ padding: '2px 6px', fontSize: '0.78rem' }}>+</button>
                    )}
                    {scoringForm.sprint_points.length > 1 && i === scoringForm.sprint_points.length - 1 && (
                      <button className="btn btn-ghost btn-sm" onClick={() => {
                        setScoringForm((f: any) => ({ ...f, sprint_points: f.sprint_points.slice(0, -1) }));
                      }} style={{ padding: '2px 6px', fontSize: '0.78rem', color: 'var(--accent-red)' }}>−</button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-6 mt-2">
                <div>
                  <label className="form-label">Pole Bonus</label>
                  <input type="number" value={scoringForm.pole_bonus} onChange={e => setScoringForm((f: any) => ({ ...f, pole_bonus: parseInt(e.target.value) || 0 }))}
                    style={{ width: 80 }} />
                </div>
                <div>
                  <label className="form-label">Fastest Lap Bonus</label>
                  <input type="number" value={scoringForm.fastest_lap_bonus} onChange={e => setScoringForm((f: any) => ({ ...f, fastest_lap_bonus: parseInt(e.target.value) || 0 }))}
                    style={{ width: 80 }} />
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <button className="btn btn-ghost" onClick={() => setShowScoring(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveScoring}>Save Scoring</button>
              </div>
            </div>
          </Modal>
        )}

        {selectedRace && (
          <Modal onClose={() => setSelectedRace(null)} title="Enter Results" wide>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="tabs" style={{ marginBottom: 8 }}>
                <button className={`tab ${resultsTab === 'race' ? 'active' : ''}`} onClick={() => setResultsTab('race')}>Main Race</button>
                {selectedRaceData?.has_sprint && (
                  <button className={`tab ${resultsTab === 'sprint' ? 'active' : ''}`} onClick={() => setResultsTab('sprint')}>Sprint</button>
                )}
                <button className={`tab ${resultsTab === 'qualifying' ? 'active' : ''}`} onClick={() => setResultsTab('qualifying')}>Qualifying</button>
              </div>

              {resultsTab === 'sprint' ? (
                <>
                  <p className="text-sm text-secondary mb-2">Seleziona un pilota per ogni posizione della Sprint.</p>
                  <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {Array.from({ length: drivers.length }, (_, i) => i + 1).map(pos => {
                      const driverId = sprintSelections[pos] || '';
                      const driver = drivers.find(d => d.id === driverId);
                      const team = driver ? teams.find((t: any) => t.id === driver.team_id) : null;
                      return (
                        <div key={`s-${pos}`} className="result-entry" style={{
                          opacity: driverId && sprintExtras[driverId]?.present === false ? 0.6 : 1,
                          background: driverId && sprintExtras[driverId]?.dnf ? 'var(--accent-red-light)' : driverId && sprintExtras[driverId]?.present === false ? 'var(--accent-orange-light)' : 'var(--bg-secondary)',
                        }}>
                          <span className="result-pos">P{pos}</span>
                          <select style={{ flex: 1, minWidth: 140, padding: '4px 6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                            value={driverId}
                            onChange={e => {
                              const newId = e.target.value;
                              setSprintSelections(prev => {
                                const next = { ...prev };
                                Object.keys(next).forEach(k => { if (next[Number(k)] === newId) next[Number(k)] = ''; });
                                next[pos] = newId;
                                return next;
                              });
                            }}>
                            <option value="">— Select driver —</option>
                            {availableDrivers(sprintSelections, pos).map(d => (
                              <option key={d.id} value={d.id}>#{d.number} {d.name}</option>
                            ))}
                          </select>
                          {driver && (
                            <>
                              <span className="team-dot" style={{ background: team?.color || 'var(--text-muted)' }} />
                              <label className="result-checkbox present-checkbox">
                                <input type="checkbox" checked={sprintExtras[driverId]?.present !== false}
                                  onChange={e => setSprintExtras(prev => ({
                                    ...prev,
                                    [driverId]: { ...prev[driverId], present: e.target.checked, dnf: e.target.checked ? prev[driverId]?.dnf : false }
                                  }))} />
                                Present
                              </label>
                              <label className="result-checkbox">
                                <input type="radio" name={`sfl-${selectedRace}`} checked={sprintExtras[driverId]?.fl || false}
                                  disabled={sprintExtras[driverId]?.present === false}
                                  onChange={() => setSprintExtras(prev => {
                                    const next = { ...prev };
                                    Object.keys(next).forEach(k => { next[k] = { ...next[k], fl: false }; });
                                    next[driverId] = { ...next[driverId], fl: true };
                                    return next;
                                  })} />
                                FL
                              </label>
                              <label className="result-checkbox">
                                <input type="checkbox" checked={sprintExtras[driverId]?.dnf || false}
                                  disabled={sprintExtras[driverId]?.present === false}
                                  onChange={e => setSprintExtras(prev => ({
                                    ...prev,
                                    [driverId]: { ...prev[driverId], dnf: e.target.checked }
                                  }))} />
                                DNF
                              </label>
                              <input value={sprintExtras[driverId]?.penalties || ''}
                                onChange={e => setSprintExtras(prev => ({
                                  ...prev,
                                  [driverId]: { ...prev[driverId], penalties: e.target.value }
                                }))}
                                className="result-pen-input" placeholder="Pen." />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : resultsTab === 'qualifying' ? (
                <>
                  <p className="text-sm text-secondary mb-2">Seleziona un pilota per ogni posizione in Qualifica.</p>
                  <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {Array.from({ length: drivers.length }, (_, i) => i + 1).map(pos => {
                      const driverId = qualifyingSelections[pos] || '';
                      const driver = drivers.find(d => d.id === driverId);
                      const team = driver ? teams.find((t: any) => t.id === driver.team_id) : null;
                      return (
                        <div key={`q-${pos}`} className="result-entry" style={{ background: 'var(--bg-secondary)' }}>
                          <span className="result-pos">P{pos}</span>
                          <select style={{ flex: 1, minWidth: 140, padding: '4px 6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                            value={driverId}
                            onChange={e => {
                              const newId = e.target.value;
                              setQualifyingSelections(prev => {
                                const next = { ...prev };
                                Object.keys(next).forEach(k => { if (next[Number(k)] === newId) next[Number(k)] = ''; });
                                next[pos] = newId;
                                return next;
                              });
                            }}>
                            <option value="">— Select driver —</option>
                            {availableDrivers(qualifyingSelections, pos).map(d => (
                              <option key={d.id} value={d.id}>#{d.number} {d.name}</option>
                            ))}
                          </select>
                          {driver && (
                            <span className="team-dot" style={{ background: team?.color || 'var(--text-muted)' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-secondary mb-2">Seleziona un pilota per ogni posizione. Spunta Pole, FL, DNF per i piloti selezionati.</p>
                  <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {Array.from({ length: drivers.length }, (_, i) => i + 1).map(pos => {
                      const driverId = raceSelections[pos] || '';
                      const driver = drivers.find(d => d.id === driverId);
                      const team = driver ? teams.find((t: any) => t.id === driver.team_id) : null;
                      const reserveDriver = team ? drivers.find(d => d.id === team.reserve_driver_id) : null;
                      return (
                        <div key={`r-${pos}`} className="result-entry" style={{
                          opacity: driverId && raceExtras[driverId]?.present === false ? 0.6 : 1,
                          background: driverId && raceExtras[driverId]?.dnf ? 'var(--accent-red-light)' : driverId && raceExtras[driverId]?.present === false ? 'var(--accent-orange-light)' : 'var(--bg-secondary)',
                        }}>
                          <span className="result-pos">P{pos}{pos === 1 ? ' 🏆' : ''}</span>
                          <select style={{ flex: 1, minWidth: 140, padding: '4px 6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                            value={driverId}
                            onChange={e => {
                              const newId = e.target.value;
                              setRaceSelections(prev => {
                                const next = { ...prev };
                                Object.keys(next).forEach(k => { if (next[Number(k)] === newId) next[Number(k)] = ''; });
                                next[pos] = newId;
                                return next;
                              });
                            }}>
                            <option value="">— Select driver —</option>
                            {availableDrivers(raceSelections, pos).map(d => (
                              <option key={d.id} value={d.id}>#{d.number} {d.name}</option>
                            ))}
                          </select>
                          {driver && (
                            <>
                              <span className="team-dot" style={{ background: team?.color || 'var(--text-muted)' }} />
                              {raceExtras[driverId]?.present === false && reserveDriver && (
                                <span className="text-xs text-accent-orange" style={{ marginLeft: 2 }}>
                                  → {reserveDriver.name}
                                </span>
                              )}
                              <label className="result-checkbox present-checkbox">
                                <input type="checkbox" checked={raceExtras[driverId]?.present !== false}
                                  onChange={e => setRaceExtras(prev => ({
                                    ...prev,
                                    [driverId]: { ...prev[driverId], present: e.target.checked, dnf: e.target.checked ? prev[driverId]?.dnf : false, pole: e.target.checked ? prev[driverId]?.pole : false, fl: e.target.checked ? prev[driverId]?.fl : false }
                                  }))} />
                                Present
                              </label>
                              <label className="result-checkbox">
                                <input type="checkbox" checked={raceExtras[driverId]?.pole || false}
                                  disabled={raceExtras[driverId]?.present === false}
                                  onChange={e => setRaceExtras(prev => ({
                                    ...prev,
                                    [driverId]: { ...prev[driverId], pole: e.target.checked }
                                  }))} />
                                Pole
                              </label>
                              <label className="result-checkbox">
                                <input type="radio" name={`fl-${selectedRace}`} checked={raceExtras[driverId]?.fl || false}
                                  disabled={raceExtras[driverId]?.present === false}
                                  onChange={() => setRaceExtras(prev => {
                                    const next = { ...prev };
                                    Object.keys(next).forEach(k => { next[k] = { ...next[k], fl: false }; });
                                    next[driverId] = { ...next[driverId], fl: true };
                                    return next;
                                  })} />
                                FL
                              </label>
                              <label className="result-checkbox">
                                <input type="checkbox" checked={raceExtras[driverId]?.dnf || false}
                                  disabled={raceExtras[driverId]?.present === false}
                                  onChange={e => setRaceExtras(prev => ({
                                    ...prev,
                                    [driverId]: { ...prev[driverId], dnf: e.target.checked }
                                  }))} />
                                DNF
                              </label>
                              <input value={raceExtras[driverId]?.penalties || ''}
                                onChange={e => setRaceExtras(prev => ({
                                  ...prev,
                                  [driverId]: { ...prev[driverId], penalties: e.target.value }
                                }))}
                                className="result-pen-input" placeholder="Pen." />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              <div className="flex justify-between mt-3">
                <button className="btn btn-ghost" onClick={() => setSelectedRace(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={submitResults}>Save Results</button>
              </div>
            </div>
          </Modal>
        )}
      </div>

      <style>{`
        .race-item {
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 8px;
          border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px;
        }
        .form-label { display: block; color: var(--text-secondary); font-size: 0.82rem; margin-bottom: 4px; }
        .team-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
        .scoring-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .scoring-item { display: flex; align-items: center; gap: 6px; }
        .scoring-label { font-size: 0.82rem; color: var(--text-secondary); min-width: 32px; }
        .scoring-input { width: 70px; padding: 5px 8px; font-size: 0.85rem; }
        .result-entry {
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          padding: 6px 10px; display: flex; align-items: center; gap: 6px;
          cursor: grab; font-size: 0.85rem; flex-wrap: wrap;
        }
        .result-pos { color: var(--text-muted); font-weight: 600; min-width: 32px; font-size: 0.78rem; }
        .result-driver { font-weight: 500; flex: 1; min-width: 120px; }
        .result-checkbox { font-size: 0.72rem; display: flex; align-items: center; gap: 2px; white-space: nowrap; }
        .result-ql-input { width: 44px; padding: 3px 4px; font-size: 0.75rem; }
        .result-pen-input { width: 70px; padding: 3px 4px; font-size: 0.75rem; }
        @media (max-width: 600px) {
          .scoring-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

function Modal({ children, onClose, title, wide }: { children: React.ReactNode; onClose: () => void; title: string; wide?: boolean }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ width: wide ? 650 : 420 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {children}
      </div>
      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 20px;
        }
        .modal-content {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 24px;
          max-width: 100%; max-height: 85vh; overflow: auto;
          box-shadow: var(--shadow-xl);
        }
      `}</style>
    </div>
  );
}
