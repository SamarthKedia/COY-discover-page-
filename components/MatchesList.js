'use client';

import Avatar from './Avatar.js';

function timeAgo(iso) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export default function MatchesList({ matches, loading, onGoToDeck }) {
  if (loading) return <div className="loading">Opening the envelopes…</div>;

  if (matches.length === 0) {
    return (
      <div className="empty">
        <div className="empty-envelope" aria-hidden="true" />
        <h2>No mutual matches yet</h2>
        <p>Likes stay sealed. You’ll only see someone here when you’ve both said yes.</p>
        <button type="button" className="btn btn-ink" onClick={onGoToDeck}>
          Back to the deck
        </button>
      </div>
    );
  }

  return (
    <ul className="matches">
      {matches.map((m, i) => (
        <li key={m.id} className="match-row" style={{ '--d': `${i * 40}ms` }}>
          <Avatar src={m.photo} name={m.name} className="match-row-img" />
          <div className="match-row-text">
            <strong>
              {m.name}, {m.age}
            </strong>
            <span>{m.college}</span>
          </div>
          <time className="match-row-time" dateTime={m.matchedAt}>
            {timeAgo(m.matchedAt)}
          </time>
        </li>
      ))}
    </ul>
  );
}
