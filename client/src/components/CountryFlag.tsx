import React from 'react';
import { flagForNationality } from '../utils/nationalities';

export default function CountryFlag({ nationality, size, title }: { nationality?: string; size?: number; title?: boolean }) {
  const flag = flagForNationality(nationality);
  if (!flag) return null;
  return (
    <span
      className="country-flag"
      title={title ? nationality : undefined}
      style={size ? { fontSize: size, lineHeight: 1 } : undefined}
    >
      {flag}
    </span>
  );
}