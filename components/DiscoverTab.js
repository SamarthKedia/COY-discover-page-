'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import SwipeCard from './SwipeCard.js';
import MatchOverlay from './MatchOverlay.js';
import MatchesList from './MatchesList.js';

async function api(path, options) {
  const res = await fetch(path, { cache: 'no-store', ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export default function DiscoverTab() {
  const [view, setView] = useState('deck'); // 'deck' | 'matches'
  const [deck, setDeck] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [match, setMatch] = useState(null); // profile shown in "It's a match!"
  const [toast, setToast] = useState(null);
  const topCard = useRef(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((text, tone) => {
    clearTimeout(toastTimer.current);
    setToast({ text, tone, key: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [feed, m] = await Promise.all([api('/api/feed'), api('/api/matches')]);
      setDeck(feed.profiles);
      setMatches(m.matches);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSwipe = useCallback(
    async (profile, action) => {
      // Optimistic: drop the card right away so the next one is ready.
      setDeck((d) => d.filter((p) => p.id !== profile.id));
      showToast(
        action === 'like' ? `Liked ${profile.name} — sealed until it’s mutual` : `Passed on ${profile.name}`,
        action
      );
      try {
        const result = await api('/api/swipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId: profile.id, action }),
        });
        if (result.matched) {
          setMatches((m) => [result.match, ...m.filter((x) => x.id !== result.match.id)]);
          setMatch(result.match);
        }
      } catch (e) {
        if (e.status === 409) return; // already recorded (e.g. another tab) — keep it gone
        setDeck((d) => [profile, ...d]); // put it back so the swipe can be retried
        showToast('Couldn’t save that swipe. Try again.', 'error');
      }
    },
    [showToast]
  );

  // Arrow keys on desktop.
  useEffect(() => {
    if (view !== 'deck' || match) return;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') topCard.current?.fling('right');
      if (e.key === 'ArrowLeft') topCard.current?.fling('left');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, match]);

  async function resetDemo() {
    try {
      await api('/api/reset', { method: 'POST' });
      await load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  const visible = deck.slice(0, 3);

  return (
    <section className="discover">
      <header className="discover-head">
        <h1 className="wordmark">
          coy<span>.</span>
        </h1>
        <div className="segmented" role="tablist" aria-label="Discover views">
          <button role="tab" aria-selected={view === 'deck'} className={view === 'deck' ? 'on' : ''} onClick={() => setView('deck')}>
            Deck
          </button>
          <button role="tab" aria-selected={view === 'matches'} className={view === 'matches' ? 'on' : ''} onClick={() => setView('matches')}>
            Matches
            {matches.length > 0 && <span className="badge">{matches.length}</span>}
          </button>
        </div>
      </header>

      {view === 'matches' ? (
        <MatchesList matches={matches} loading={loading} onGoToDeck={() => setView('deck')} />
      ) : loading ? (
        <div className="loading">Shuffling the deck…</div>
      ) : error ? (
        <div className="empty">
          <h2>Couldn’t load profiles</h2>
          <p>{error}</p>
          <button type="button" className="btn btn-ink" onClick={load}>
            Try again
          </button>
        </div>
      ) : deck.length === 0 ? (
        <div className="empty">
          <div className="empty-stack" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h2>You’ve seen everyone</h2>
          <p>No new profiles right now. Check your matches, or come back later for fresh faces.</p>
          <div className="empty-actions">
            <button type="button" className="btn btn-ink" onClick={() => setView('matches')}>
              View matches ({matches.length})
            </button>
            <button type="button" className="btn btn-ghost" onClick={resetDemo}>
              Reset demo data
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="deck">
            {visible
              .map((p, i) => (
                <div key={p.id} className="card-slot" style={{ '--depth': i, zIndex: 10 - i }} aria-hidden={i > 0}>
                  <SwipeCard
                    ref={i === 0 ? topCard : undefined}
                    profile={p}
                    interactive={i === 0}
                    onSwipe={(action) => handleSwipe(p, action)}
                  />
                </div>
              ))
              .reverse()}
          </div>

          <div className="actions">
            <button type="button" className="action action-pass" aria-label="Pass" onClick={() => topCard.current?.fling('left')}>
              <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
              </svg>
            </button>
            <span className="actions-hint">
              {deck.length} left · <kbd>←</kbd> <kbd>→</kbd>
            </span>
            <button type="button" className="action action-like" aria-label="Like" onClick={() => topCard.current?.fling('right')}>
              <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
                <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </>
      )}

      {toast && (
        <div key={toast.key} className={`toast toast-${toast.tone}`} role="status">
          {toast.text}
        </div>
      )}

      {match && (
        <MatchOverlay
          match={match}
          onClose={() => setMatch(null)}
          onViewMatches={() => {
            setMatch(null);
            setView('matches');
          }}
        />
      )}
    </section>
  );
}
