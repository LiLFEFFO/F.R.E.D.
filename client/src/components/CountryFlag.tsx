import React, { useState } from 'react';
import { flagForNationality, countryCodeFor } from '../utils/nationalities';

export default function CountryFlag({ nationality, size, title }: { nationality?: string; size?: number; title?: boolean }) {
  const flag = flagForNationality(nationality);
  const code = countryCodeFor(nationality);
  const [imgFailed, setImgFailed] = useState(false);

  if (!flag) return null;
  const h = size || 16;
  const w = Math.round(h * 1.4);

  if (code && !imgFailed) {
    return (
      <img
        className="country-flag"
        src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
        alt={nationality}
        title={title ? nationality : undefined}
        width={w}
        height={h}
        style={{ marginRight: 6, borderRadius: 2, verticalAlign: 'middle', objectFit: 'cover' }}
        loading="lazy"
        onError={() => setImgFailed(true)}
      />
    );
  }
  return (
    <span
      className="country-flag"
      title={title ? nationality : undefined}
      style={{ marginRight: 6, fontSize: h, lineHeight: 1, verticalAlign: 'middle' }}
    >
      {flag}
    </span>
  );
}