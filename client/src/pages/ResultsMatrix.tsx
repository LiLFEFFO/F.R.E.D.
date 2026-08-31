import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import CountryFlag from '../components/CountryFlag';

type MatrixData = {
  championship: any;
  drivers: any[];
  races: any[];
  matrix: Record<string, Record<string, any>>;
};

export default function ResultsMatrix() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.championships.resultsMatrix(id)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><div className="loading"><div className="spinner" /></div></div>;
  if (error) return <div className="page"><div className="container"><div className="alert alert-error">{error}</div></div></div>;
  if (!data) return <div className="page"><div className="empty-state"><h3>Not found</h3></div></div>;

  const { championship, drivers, races, matrix } = data;

  const hasAnySprint = races.some(r => r.has_sprint);

  const getCell = (race: any, driverId: string, type: 'qualifying' | 'sprint' | 'race') => {
    const cell = matrix[driverId]?.[race.id];
    if (!cell) return '—';
    if (race.status !== 'completed' && race.status !== 'in_progress') return '—';
    if (type === 'qualifying') {
      if (cell.qualifying == null) return '—';
      return `P${cell.qualifying}`;
    }
    if (type === 'sprint') {
      if (!race.has_sprint) return null;
      if (!cell.sprint) return '—';
      if (!cell.sprint.present) return 'DNS';
      if (cell.sprint.dnf) return 'DNF';
      return `P${cell.sprint.position}`;
    }
    if (type === 'race') {
      if (!cell.race) return '—';
      if (!cell.race.present) return 'DNS';
      if (cell.race.dnf) return 'DNF';
      return `P${cell.race.position}`;
    }
    return '—';
  };

  const getCellClass = (race: any, driverId: string, type: 'qualifying' | 'sprint' | 'race') => {
    const cell = matrix[driverId]?.[race.id];
    if (!cell) return '';
    if (type === 'race' && cell.race) {
      if (!cell.race.present) return 'cell-dns';
      if (cell.race.dnf) return 'cell-dnf';
      if (cell.race.position === 1) return 'cell-win';
      if (cell.race.position <= 3) return 'cell-podium';
      return '';
    }
    if (type === 'sprint' && cell.sprint) {
      if (!cell.sprint.present) return 'cell-dns';
      if (cell.sprint.dnf) return 'cell-dnf';
      if (cell.sprint.position === 1) return 'cell-win';
      if (cell.sprint.position <= 3) return 'cell-podium';
      return '';
    }
    if (type === 'qualifying' && cell.qualifying != null) {
      if (cell.qualifying === 1) return 'cell-pole';
      if (cell.qualifying <= 3) return 'cell-podium';
    }
    return '';
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '100%', padding: '0 24px' }}>
        <Link to={`/championships/${championship.id}`} className="btn btn-ghost btn-sm mb-4" style={{ display: 'inline-flex' }}>
          ← Back to {championship.name}
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h1 className="section-title" style={{ marginBottom: 4 }}>Race Overview — {championship.name}</h1>
            <p className="text-sm text-secondary">Full spreadsheet: qualifying, sprint {hasAnySprint ? 'and' : '(when available)'} race positions for every driver</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to={`/championships/${championship.id}/compare`} className="btn btn-secondary btn-sm">Compare Chart →</Link>
          </div>
        </div>

        {drivers.length === 0 || races.length === 0 ? (
          <div className="empty-state"><h3>No data yet</h3><p>Add drivers and races to see the matrix.</p></div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="matrix-wrapper">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th className="sticky-col header-driver" rowSpan={2}>Driver</th>
                    {races.map(r => {
                      const cols = r.has_sprint ? 3 : 2;
                      return (
                        <th key={r.id} colSpan={cols} className="header-race">
                          <div className="race-header-top" title={`${r.circuit} · ${new Date(r.date).toLocaleDateString()}`}>
                            {r.name}
                            <span className={`badge ${r.status === 'completed' ? 'badge-green' : r.status === 'in_progress' ? 'badge-orange' : 'badge-blue'}`} style={{ marginLeft: 6, fontSize: '0.6rem' }}>
                              {r.status === 'completed' ? 'Done' : r.status === 'in_progress' ? 'Live' : 'Sched'}
                            </span>
                          </div>
                          <div className="race-header-circuit">{r.circuit}</div>
                        </th>
                      );
                    })}
                  </tr>
                  <tr>
                    {races.map(r => (
                      <React.Fragment key={`sub-${r.id}`}>
                        <th className="header-sub">Q</th>
                        {r.has_sprint && <th className="header-sub">S</th>}
                        <th className="header-sub">R</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drivers.map(d => (
                    <tr key={d.id}>
                      <td className="sticky-col driver-cell">
                        <div className="driver-cell-inner">
                          <span className="team-dot" style={{ background: d.team_color || 'var(--text-muted)' }} />
                          <CountryFlag nationality={d.nationality} />
                          <Link to={`/drivers/${d.id}`} className="driver-link-matrix">{d.name}</Link>
                          <span className="text-muted text-xs">#{d.number}</span>
                          {d.position && <span className="badge badge-blue" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>P{d.position}</span>}
                        </div>
                        <div className="driver-team-name">{d.team_name || '-'}</div>
                      </td>
                      {races.map(r => (
                        <React.Fragment key={`${d.id}-${r.id}`}>
                          <td className={`matrix-cell ${getCellClass(r, d.id, 'qualifying')}`} title={`Qualifying: ${getCell(r, d.id, 'qualifying')}`}>
                            {getCell(r, d.id, 'qualifying')}
                            {matrix[d.id]?.[r.id]?.race?.pole && <span className="micro-badge pole">Pole</span>}
                          </td>
                          {r.has_sprint && (
                            <td className={`matrix-cell ${getCellClass(r, d.id, 'sprint')}`} title={`Sprint: ${getCell(r, d.id, 'sprint')}${matrix[d.id]?.[r.id]?.sprint?.points ? ` · ${matrix[d.id][r.id].sprint.points} pts` : ''}`}>
                              <span>{getCell(r, d.id, 'sprint')}</span>
                              {matrix[d.id]?.[r.id]?.sprint?.points > 0 && <span className="pts">{matrix[d.id][r.id].sprint.points} pts</span>}
                            </td>
                          )}
                          <td className={`matrix-cell ${getCellClass(r, d.id, 'race')}`} title={`Race: ${getCell(r, d.id, 'race')}${matrix[d.id]?.[r.id]?.race?.points ? ` · ${matrix[d.id][r.id].race.points} pts` : ''}`}>
                            <span>{getCell(r, d.id, 'race')}</span>
                            {matrix[d.id]?.[r.id]?.race?.points > 0 && <span className="pts">{matrix[d.id][r.id].race.points} pts</span>}
                            {matrix[d.id]?.[r.id]?.race?.fastest_lap && <span className="micro-badge fl">FL</span>}
                          </td>
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="matrix-legend">
              <span><span className="legend-dot" style={{ background: 'var(--accent-gold-light)', border: '1px solid var(--accent-gold)' }} /> Win</span>
              <span><span className="legend-dot" style={{ background: 'var(--accent-green-light)', border: '1px solid var(--accent-green)' }} /> Podium</span>
              <span><span className="legend-dot" style={{ background: '#fef3c7', border: '1px solid #f59e0b' }} /> Pole</span>
              <span><span className="legend-dot" style={{ background: 'var(--accent-red-light)', border: '1px solid var(--accent-red)' }} /> DNF/DNS</span>
              <span>Q = Qualifying, S = Sprint, R = Race</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .matrix-wrapper { overflow: auto; max-width: 100%; border-radius: var(--radius); }
        .matrix-table { border-collapse: separate; border-spacing: 0; width: max-content; min-width: 100%; font-size: 0.82rem; }
        .matrix-table th, .matrix-table td { border-bottom: 1px solid var(--border-light); border-right: 1px solid var(--border-light); white-space: nowrap; }
        .matrix-table th { background: var(--bg-secondary); font-weight: 600; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.03em; color: var(--text-secondary); padding: 8px 10px; position: sticky; top: 0; z-index: 2; }
        .matrix-table td { padding: 8px 10px; background: var(--bg-card); text-align: center; }
        .sticky-col { position: sticky; left: 0; z-index: 3; background: var(--bg-card) !important; }
        .header-driver { min-width: 200px; text-align: left !important; z-index: 4 !important; background: var(--bg-secondary) !important; }
        .header-race { text-align: center; min-width: 120px; }
        .race-header-top { font-size: 0.75rem; font-weight: 700; color: var(--text); text-transform: none; letter-spacing: 0; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; }
        .race-header-circuit { font-size: 0.65rem; font-weight: 400; color: var(--text-muted); text-transform: none; letter-spacing: 0; }
        .header-sub { min-width: 68px; font-size: 0.7rem; }
        .driver-cell { text-align: left !important; min-width: 200px; }
        .driver-cell-inner { display: flex; align-items: center; gap: 6px; font-weight: 600; color: var(--text); }
        .driver-link-matrix { color: var(--text); font-size: 0.85rem; }
        .driver-link-matrix:hover { color: var(--accent); }
        .driver-team-name { font-size: 0.68rem; color: var(--text-muted); margin-left: 14px; margin-top: 2px; }
        .team-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
        .matrix-cell { font-weight: 600; font-size: 0.8rem; position: relative; }
        .matrix-cell .pts { display: block; font-size: 0.6rem; font-weight: 500; color: var(--text-muted); margin-top: 2px; }
        .micro-badge { display: inline-block; font-size: 0.55rem; padding: 1px 4px; border-radius: 4px; margin-left: 4px; font-weight: 700; }
        .micro-badge.pole { background: #fef3c7; color: #d97706; }
        .micro-badge.fl { background: var(--accent-purple); color: #fff; }
        .cell-win { background: var(--accent-gold-light) !important; color: var(--accent-gold); }
        .cell-podium { background: var(--accent-green-light) !important; }
        .cell-pole { background: #fef3c7 !important; }
        .cell-dnf { background: var(--accent-red-light) !important; color: var(--accent-red); }
        .cell-dns { background: var(--bg-secondary) !important; color: var(--text-muted); }
        .matrix-legend { display: flex; gap: 16px; flex-wrap: wrap; padding: 12px 16px; font-size: 0.72rem; color: var(--text-muted); border-top: 1px solid var(--border-light); align-items: center; }
        .legend-dot { width: 12px; height: 12px; border-radius: 3px; display: inline-block; vertical-align: middle; margin-right: 4px; }
        @media (max-width: 768px) {
          .header-driver, .driver-cell { min-width: 160px; }
          .matrix-table th, .matrix-table td { padding: 6px 8px; }
        }
      `}</style>
    </div>
  );
}
