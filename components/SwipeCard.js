'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import Avatar from './Avatar.js';

const SWIPE_THRESHOLD = 110; // px of horizontal drag that commits a swipe
const FLICK_VELOCITY = 0.6; // px/ms — a fast flick commits even if short
const EXIT_MS = 320;

/**
 * One profile card. Drag it (mouse, touch or pen — Pointer Events) or call
 * ref.current.fling('left' | 'right') from the buttons / keyboard.
 * `onSwipe(action)` fires once the exit animation finishes.
 */
const SwipeCard = forwardRef(function SwipeCard({ profile, onSwipe, interactive }, ref) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState(null); // 'left' | 'right' | null
  const start = useRef(null);

  function fling(dir) {
    if (leaving) return;
    setDragging(false);
    setLeaving(dir);
    setTimeout(() => onSwipe(dir === 'right' ? 'like' : 'pass'), EXIT_MS);
  }

  useImperativeHandle(ref, () => ({ fling }));

  function onPointerDown(e) {
    if (!interactive || leaving) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    setDragging(true);
  }

  function onPointerMove(e) {
    if (!start.current) return;
    setPos({ x: e.clientX - start.current.x, y: (e.clientY - start.current.y) * 0.4 });
  }

  function onPointerUp(e) {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const velocity = Math.abs(dx) / Math.max(1, performance.now() - start.current.t);
    start.current = null;
    if (Math.abs(dx) > SWIPE_THRESHOLD || (Math.abs(dx) > 40 && velocity > FLICK_VELOCITY)) {
      fling(dx > 0 ? 'right' : 'left');
    } else {
      setDragging(false);
      setPos({ x: 0, y: 0 });
    }
  }

  const x = leaving ? (leaving === 'right' ? 1 : -1) * 640 : pos.x;
  const y = leaving ? pos.y + 40 : pos.y;
  const rotate = leaving ? (leaving === 'right' ? 24 : -24) : pos.x / 16;
  const likeAlpha = leaving === 'right' ? 1 : Math.min(1, Math.max(0, pos.x / SWIPE_THRESHOLD));
  const passAlpha = leaving === 'left' ? 1 : Math.min(1, Math.max(0, -pos.x / SWIPE_THRESHOLD));

  return (
    <article
      className={`card ${dragging ? 'is-dragging' : ''}`}
      style={{
        transform: `translate(${x}px, ${y}px) rotate(${rotate}deg)`,
        transition: dragging ? 'none' : `transform ${EXIT_MS}ms cubic-bezier(.2,.8,.25,1), opacity ${EXIT_MS}ms`,
        opacity: leaving ? 0 : 1,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-label={`${profile.name}, ${profile.age}`}
    >
      <div className="card-photo">
        <Avatar src={profile.photo} name={profile.name} className="card-img" />
        <span className="stamp stamp-like" style={{ opacity: likeAlpha }}>Yes</span>
        <span className="stamp stamp-pass" style={{ opacity: passAlpha }}>Pass</span>
        <span className="card-ticket">№ {profile.id.replace('p', '')}</span>
      </div>

      <div className="card-body">
        <h2 className="card-name">
          {profile.name}<span className="card-age">, {profile.age}</span>
        </h2>
        <p className="card-place">
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M12 21s-6.5-6.2-6.5-11A6.5 6.5 0 0 1 18.5 10c0 4.8-6.5 11-6.5 11z" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="10" r="2.2" fill="currentColor" />
          </svg>
          {profile.college} · {profile.city}
        </p>
        <p className="card-bio">{profile.bio}</p>
        <ul className="card-tags">
          {profile.interests.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </div>
    </article>
  );
});

export default SwipeCard;
