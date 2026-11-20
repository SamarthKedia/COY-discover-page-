'use client';

import { useEffect, useRef } from 'react';
import Avatar from './Avatar.js';

export default function MatchOverlay({ match, onClose, onViewMatches }) {
  const primary = useRef(null);

  useEffect(() => {
    primary.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="match" role="dialog" aria-modal="true" aria-labelledby="match-title">
      <div className="match-confetti" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <i key={i} style={{ '--i': i }} />
        ))}
      </div>

      <p className="match-kicker">Sealed → opened</p>
      <h2 id="match-title" className="match-title">
        It’s a <em>match!</em>
      </h2>

      <div className="match-polaroids">
        <figure className="polaroid polaroid-me">
          <div className="avatar-fallback polaroid-img" style={{ background: '#D7F75B' }}>You</div>
          <figcaption>you</figcaption>
        </figure>
        <figure className="polaroid polaroid-them">
          <Avatar src={match.photo} name={match.name} className="polaroid-img" />
          <figcaption>{match.name.toLowerCase()}</figcaption>
        </figure>
      </div>

      <p className="match-copy">
        You and {match.name} both said yes. Neither of you knew until right now.
      </p>

      <div className="match-actions">
        <button ref={primary} type="button" className="btn btn-lime" onClick={onViewMatches}>
          See your matches
        </button>
        <button type="button" className="btn btn-ghost-light" onClick={onClose}>
          Keep swiping
        </button>
      </div>
    </div>
  );
}
