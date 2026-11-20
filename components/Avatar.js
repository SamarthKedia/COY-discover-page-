'use client';

import { useState } from 'react';

const TINTS = ['#D7F75B', '#B7A6F5', '#FF6A4D', '#7FD1C1', '#F5C46B'];

/** Photo with an initials fallback if the placeholder image fails to load. */
export default function Avatar({ src, name, className = '' }) {
  const [broken, setBroken] = useState(false);
  if (broken || !src) {
    const tint = TINTS[(name?.charCodeAt(0) ?? 0) % TINTS.length];
    return (
      <div className={`avatar-fallback ${className}`} style={{ background: tint }} aria-label={name}>
        {name?.[0] ?? '?'}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={className}
      draggable={false}
      onError={() => setBroken(true)}
    />
  );
}
