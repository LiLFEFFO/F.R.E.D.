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

  const getCell = (race: any, driverId: string, type: 'qualifying' | 'sprint' | 'race') => {
    const cell = matrix[driverId]?.[race.id];
    if (!cell) return '—';
    if (race.status !== 'completed' && race.status !== 'in_progress') return '—';
    if (type === 'qualifying') {
      if (cell.qualifying == null) return '—';
      return String(cell.qualifying);
    }
    if (type === 'sprint') {
      if (!race.has_sprint) return null;
      if (!cell.sprint) return '—';
      if (!cell.sprint.present) return '—';
      if (cell.sprint.dnf) return '—';
      return String(cell.sprint.position);
    }
    if (type === 'race') {
      if (!cell.race) return '—';
      if (!cell.race.present) return '—';
      if (cell.race.dnf) return '—';
      return String(cell.race.position);
    }
    return '—';
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
            <p className="text-sm text-secondary">{races.length} races · {drivers.length} drivers · Q / S / R positions</p>
          </div>
          <Link to={`/championships/${championship.id}/compare`} className="btn btn-secondary btn-sm">Compare Chart →</Link>
        </div>

        {drivers.length === 0 || races.length === 0 ? (
          <div className="empty-state"><h3>No data yet</h3><p>Add drivers and races to see the matrix.</p></div>
        ) : (
          <div className="minimal-card">
            <div className="matrix-wrapper">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th className="sticky-col header-driver" rowSpan={2}>Driver</th>
                    {races.map(r => {
                      const cols = r.has_sprint ? 3 : 2;
                      return (
                        <th key={r.id} colSpan={cols} className="header-race">
                          <div className="race-name">{r.name}</div>
                          <div className="race-circuit">{r.circuit}</div>
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
                          <span className="team-dot" style={{ background: d.team_color || 'var(--border)' }} />
                          <CountryFlag nationality={d.nationality} />
                          <Link to={`/drivers/${d.id}`} className="driver-link-matrix">{d.name}</Link>
                        </div>
                      </td>
                      {races.map(r => (
                        <React.Fragment key={`${d.id}-${r.id}`}>
                          <td className="matrix-cell" title={`Q: ${getCell(r, d.id, 'qualifying')}`}>
                            {getCell(r, d.id, 'qualifying')}
                          </td>
                          {r.has_sprint && (
                            <td className="matrix-cell" title={`S: ${getCell(r, d.id, 'sprint')}`}>
                              {getCell(r, d.id, 'sprint')}
                            </td>
                          )}
                          <td className="matrix-cell matrix-cell-race" title={`R: ${getCell(r, d.id, 'race')}`}>
                            {getCell(r, d.id, 'race')}
                          </td>
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="matrix-footnote">Q = Qualifying &nbsp;·&nbsp; S = Sprint &nbsp;·&nbsp; R = Race &nbsp;·&nbsp; — = not classified / not held</div>
          </div>
        )}
      </div>

      <style>{`
        .minimal-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
        }
        .matrix-wrapper { overflow: auto; max-width: 100%; }
        .matrix-table { border-collapse: collapse; width: max-content; min-width: 100%; font-size: 0.84rem; }
        .matrix-table th, .matrix-table td { white-space: nowrap; }
        .matrix-table thead th {
          background: var(--bg-secondary);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.68rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 7px 8px;
          border-bottom: 1px solid var(--border);
          border-right: 1px solid var(--border-light);
          text-align: center;
          position: sticky;
          top: 0;
          z-index: 2;
        }
        .matrix-table thead th.header-driver {
          text-align: left;
          z-index: 4;
          min-width: 180px;
        }
        .matrix-table thead th.header-race {
          min-width: 110px;
          border-right: 1px solid var(--border);
        }
        .race-name {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text);
          text-transform: none;
          letter-spacing: 0;
          line-height: 1.2;
        }
        .race-circuit {
          font-size: 0.62rem;
          font-weight: 400;
          color: var(--text-muted);
          text-transform: none;
          letter-spacing: 0;
          margin-top: 1px;
        }
        .header-sub {
          min-width: 44px;
          font-size: 0.66rem;
          font-weight: 500;
          color: var(--text-muted);
        }
        .matrix-table tbody td {
          padding: 7px 8px;
          text-align: center;
          border-bottom: 1px solid var(--border-light);
          border-right: 1px solid var(--border-light);
          background: var(--bg-card);
          color: var(--text);
          font-weight: 450;
          font-size: 0.82rem;
          font-variant-numeric: tabular-nums;
        }
        .sticky-col {
          position: sticky;
          left: 0;
          z-index: 3;
          background: var(--bg-card) !important;
          border-right: 1px solid var(--border) !important;
        }
        .driver-cell {
          text-align: left !important;
          min-width: 180px;
          padding: 7px 10px !important;
        }
        .driver-cell-inner {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
          font-size: 0.82rem;
          color: var(--text);
        }
        .driver-link-matrix { color: var(--text); font-size: 0.82rem; }
        .driver-link-matrix:hover { color: var(--accent); }
        .team-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
        .matrix-cell-race { font-weight: 600; }
        .matrix-footnote {
          padding: 8px 12px;
          font-size: 0.68rem;
          color: var(--text-muted);
          border-top: 1px solid var(--border-light);
          background: var(--bg-secondary);
          text-align: center;
          letter-spacing: 0.02em;
        }
        @media (max-width: 768px) {
          .matrix-table thead th.header-driver, .driver-cell { min-width: 150px; }
          .matrix-table tbody td, .matrix-table thead th { padding: 6px 6px; }
        }
      `}</style>
    </div>
  );
}
