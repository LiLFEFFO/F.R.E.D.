import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

type MatrixData = {
  championship: any;
  drivers: any[];
  races: any[];
  matrix: Record<string, Record<string, any>>;
};

const circuitFlagMap: Record<string, string> = {
  bahrain: '🇧🇭', australia: '🇦🇺', portugal: '🇵🇹', china: '🇨🇳', poland: '🇵🇱',
  japan: '🇯🇵', canada: '🇨🇦', indonesia: '🇮🇩', britain: '🇬🇧', uk: '🇬🇧', england: '🇬🇧',
  italy: '🇮🇹', monza: '🇮🇹', imola: '🇮🇹', latvia: '🇱🇻', turkey: '🇹🇷', india: '🇮🇳',
  belgium: '🇧🇪', spa: '🇧🇪', germany: '🇩🇪', hockenheim: '🇩🇪', nürburg: '🇩🇪',
  france: '🇫🇷', spain: '🇪🇸', austria: '🇦🇹', hungary: '🇭🇺', netherlands: '🇳🇱',
  usa: '🇺🇸', mexico: '🇲🇽', brazil: '🇧🇷', abu: '🇦🇪', qatar: '🇶🇦', saudi: '🇸🇦',
  monaco: '🇲🇨', azerbaijan: '🇦🇿', singapore: '🇸🇬',
};

function flagForCircuit(circuit: string, name: string): string {
  const hay = `${circuit} ${name}`.toLowerCase();
  for (const [k, v] of Object.entries(circuitFlagMap)) {
    if (hay.includes(k)) return v;
  }
  return '🏁';
}

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

  // drivers are already sorted by position, compute leader points
  const leaderPoints = Math.max(0, ...drivers.map((d: any) => d.points || 0));

  const getPointsForCell = (race: any, driverId: string): { display: string; halo: string; title: string } => {
    const cell = matrix[driverId]?.[race.id];
    if (!cell) return { display: '—', halo: '', title: '' };
    if (race.status !== 'completed') return { display: '—', halo: '', title: 'Not completed' };
    const hasResult = cell.race || cell.sprint;
    if (!hasResult) return { display: '0', halo: '', title: 'No result' };
    // DNF -> OUT, no points but show OUT
    const raceDNF = cell.race?.dnf && cell.race?.present;
    const sprintDNF = cell.sprint?.dnf && cell.sprint?.present;
    // if both DNF or sole race DNF with 0 points, show OUT
    const totalPoints = (cell.race?.points || 0) + (cell.sprint?.points || 0);
    const isOut = (raceDNF && totalPoints === 0) || (cell.race && !cell.race.present && (!cell.sprint || !cell.sprint.present));
    // special: if DNF but had points from sprint, still show points, not OUT
    if (isOut) {
      const q = cell.qualifying != null ? `Q${cell.qualifying}` : '-';
      return { display: 'OUT', halo: 'out', title: `${q} · DNF` };
    }
    if (totalPoints === 0) return { display: '0', halo: '', title: `Q${cell.qualifying ?? '-'} · 0 pts` };
    let halo = '';
    if (totalPoints >= 25) halo = 'halo-gold';
    else if (totalPoints >= 18) halo = 'halo-silver';
    else if (totalPoints >= 15) halo = 'halo-bronze';
    else if (totalPoints >= 10) halo = 'halo-purple';
    const parts = [];
    if (cell.qualifying != null) parts.push(`Q${cell.qualifying}`);
    if (race.has_sprint && cell.sprint) parts.push(`S P${cell.sprint.position} (${cell.sprint.points}p)`);
    if (cell.race) parts.push(`R P${cell.race.position} (${cell.race.points}p)`);
    return { display: String(totalPoints), halo, title: parts.join(' · ') };
  };

  return (
    <div className="page" style={{ background: 'var(--bg)', paddingTop: 16 }}>
      <div className="container" style={{ maxWidth: 1400 }}>
        <Link to={`/championships/${championship.id}`} className="btn btn-ghost btn-sm mb-3" style={{ display: 'inline-flex' }}>
          ← Back to {championship.name}
        </Link>

        {drivers.length === 0 || races.length === 0 ? (
          <div className="empty-state"><h3>No data yet</h3><p>Add drivers and races to see the sheet.</p></div>
        ) : (
          <div className="gt-sheet">
            <div className="gt-sheet-title">{championship.name}</div>
            <div className="gt-table-wrap">
              <table className="gt-table">
                <thead>
                  <tr>
                    <th className="gt-th gt-pos">Pos.</th>
                    <th className="gt-th gt-num">#</th>
                    <th className="gt-th gt-driver">Driver</th>
                    <th className="gt-th gt-team">Team</th>
                    <th className="gt-th gt-points">Points:</th>
                    <th className="gt-th gt-dif">Dif.</th>
                    {races.map(r => (
                      <th key={r.id} className="gt-th gt-flag" title={`${r.name} — ${r.circuit}`}>
                        <span className="gt-flag-emoji">{flagForCircuit(r.circuit, r.name)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((d: any, idx: number) => {
                    const pos = d.position || idx + 1;
                    const dif = leaderPoints - (d.points || 0);
                    const isLeader = pos === 1;
                    return (
                      <tr key={d.id} className="gt-row">
                        <td className={`gt-cell gt-pos ${isLeader ? 'gt-pos-leader' : ''}`}>{pos}</td>
                        <td className="gt-cell gt-num" style={{ color: d.team_color || '#e5e5e5' }}>{d.number}</td>
                        <td className="gt-cell gt-driver">{d.name}</td>
                        <td className="gt-cell gt-team" style={{ color: d.team_color || '#a1a1aa' }}>{d.team_name || '—'}</td>
                        <td className="gt-cell gt-points">{d.points || 0}</td>
                        <td className="gt-cell gt-dif">{isLeader ? '--' : `-${dif}`}</td>
                        {races.map(r => {
                          const { display, halo, title } = getPointsForCell(r, d.id);
                          return (
                            <td key={r.id} className="gt-cell gt-race" title={title}>
                              {display === 'OUT' ? (
                                <span className="gt-out">OUT</span>
                              ) : halo ? (
                                <span className={`gt-halo ${halo}`}>{display}</span>
                              ) : (
                                <span className="gt-plain">{display}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="gt-footnote">Points per race (Race + Sprint). <span className="gt-halo halo-gold" style={{ width: 18, height: 18, display: 'inline-flex', verticalAlign: 'middle', margin: '0 4px' }}>25</span> win &nbsp; <span className="gt-halo halo-silver" style={{ width: 18, height: 18, display: 'inline-flex', verticalAlign: 'middle', margin: '0 4px' }}>18</span> P2 &nbsp; <span className="gt-halo halo-bronze" style={{ width: 18, height: 18, display: 'inline-flex', verticalAlign: 'middle', margin: '0 4px' }}>15</span> P3 &nbsp; OUT = DNF / DNS &nbsp; — = not held</div>
          </div>
        )}
      </div>

      <style>{`
        .gt-sheet {
          background: #0a0a0e;
          border-top: 2px solid #e10600;
          border-radius: 2px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        .gt-sheet-title {
          color: #e10600;
          font-weight: 800;
          font-size: 1.1rem;
          letter-spacing: 0.02em;
          padding: 10px 14px 8px;
          border-bottom: 1px solid #fff;
          text-transform: none;
        }
        .gt-table-wrap { overflow: auto; }
        .gt-table {
          width: max-content;
          min-width: 100%;
          border-collapse: collapse;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 0.78rem;
        }
        .gt-table thead th {
          background: #0a0a0e;
          color: #9f9f9f;
          font-weight: 600;
          font-size: 0.68rem;
          letter-spacing: 0.04em;
          text-transform: none;
          padding: 6px 6px;
          border-bottom: 1px solid #fff;
          text-align: center;
          white-space: nowrap;
        }
        .gt-th.gt-driver, .gt-th.gt-team { text-align: left; padding-left: 10px; }
        .gt-th.gt-flag { min-width: 38px; font-size: 1.05rem; }
        .gt-flag-emoji { font-size: 1.05rem; line-height: 1; }
        .gt-row { border-bottom: 1px solid #3a0a0a; }
        .gt-row:last-child { border-bottom: none; }
        .gt-cell {
          padding: 6px 6px;
          text-align: center;
          white-space: nowrap;
          color: #e8e8e8;
          font-variant-numeric: tabular-nums;
          background: #0a0a0e;
        }
        .gt-pos {
          width: 32px;
          font-weight: 700;
          color: #e8e8e8;
          background: #141416 !important;
        }
        .gt-pos-leader {
          background: #e10600 !important;
          color: #fff;
        }
        .gt-num { font-weight: 800; width: 36px; }
        .gt-driver { text-align: left; padding-left: 10px !important; font-weight: 600; color: #f0f0f0; min-width: 130px; }
        .gt-team { text-align: left; padding-left: 10px !important; font-weight: 500; font-size: 0.74rem; min-width: 140px; }
        .gt-points, .gt-dif { font-weight: 600; min-width: 48px; }
        .gt-dif { color: #9f9f9f; }
        .gt-race { min-width: 38px; }
        .gt-plain { color: #d4d4d4; }
        .gt-out { color: #fff; font-size: 0.68rem; font-weight: 600; }
        .gt-halo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          font-weight: 700;
          font-size: 0.74rem;
          border: 1.5px solid transparent;
        }
        .halo-gold { border-color: #facc15; color: #facc15; }
        .halo-silver { border-color: #cbd5e1; color: #e2e8f0; }
        .halo-bronze { border-color: #d6a074; color: #e8b48a; }
        .halo-purple { border-color: #a78bfa; color: #c4b5fd; }
        .gt-footnote {
          padding: 8px 12px;
          font-size: 0.66rem;
          color: #8f8f8f;
          background: #141416;
          border-top: 1px solid #2a2a2e;
          text-align: center;
        }
        @media (max-width: 768px) {
          .gt-team { min-width: 110px; }
          .gt-driver { min-width: 110px; }
        }
      `}</style>
    </div>
  );
}
