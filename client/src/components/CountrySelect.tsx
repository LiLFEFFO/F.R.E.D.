import React, { useEffect, useRef, useState } from 'react';
import { COUNTRIES, flagForNationality } from '../utils/nationalities';

interface Props {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function CountrySelect({ value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setQuery('');
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = COUNTRIES.filter(c =>
    c.country.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="country-select" ref={ref}>
      <button type="button" className="country-select-trigger" onClick={() => setOpen(o => !o)}>
        {value ? (
          <>
            <span style={{ marginRight: 8 }}>{flagForNationality(value)}</span>
            {value}
          </>
        ) : (
          <span className="country-select-placeholder">{placeholder || 'Select nationality'}</span>
        )}
        <span style={{ marginLeft: 'auto', opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="country-select-menu">
          <div className="country-select-search">
            <input
              autoFocus
              value={query}
              placeholder="Search country..."
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="country-select-list">
            {filtered.length === 0 ? (
              <div className="country-select-empty">No countries found</div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.country}
                  type="button"
                  className={`country-select-option ${value === c.country ? 'selected' : ''}`}
                  onClick={() => { onChange(c.country); setOpen(false); }}
                >
                  <span style={{ marginRight: 8 }}>{c.flag}</span>
                  {c.country}
                </button>
              ))
            )}
          </div>
        </div>
      )}
      <style>{`
        .country-select { position: relative; }
        .country-select-trigger {
          width: 100%; display: flex; align-items: center;
          background: var(--bg); color: var(--text);
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          padding: 10px 12px; font-size: 0.9rem; cursor: pointer; text-align: left;
        }
        .country-select-placeholder { opacity: 0.6; }
        .country-select-menu {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 30;
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-sm); box-shadow: var(--shadow-xl); overflow: hidden;
        }
        .country-select-search { padding: 8px; border-bottom: 1px solid var(--border); }
        .country-select-search input {
          width: 100%; padding: 8px 10px; font-size: 0.85rem;
          background: var(--bg); color: var(--text);
          border: 1px solid var(--border); border-radius: var(--radius-sm);
        }
        .country-select-list { max-height: 240px; overflow-y: auto; padding: 4px; }
        .country-select-option {
          display: flex; align-items: center; width: 100%;
          padding: 8px 10px; font-size: 0.85rem; text-align: left;
          background: transparent; color: var(--text); border: none; border-radius: 4px; cursor: pointer;
        }
        .country-select-option:hover { background: var(--accent-light); }
        .country-select-option.selected { background: var(--accent); color: #fff; }
        .country-select-empty { padding: 12px; text-align: center; color: var(--text-muted); font-size: 0.8rem; }
      `}</style>
    </div>
  );
}