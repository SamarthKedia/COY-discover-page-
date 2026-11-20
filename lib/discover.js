// Pure business logic for Discover. No framework imports, so it is easy to test.
// Every function takes the whole state object and (for writes) mutates it;
// persistence is handled separately in lib/db.js.

/**
 * Whitelist of fields that may leave the server. Anything not listed here —
 * most importantly `likesYou` — stays private. A whitelist (not a blacklist)
 * means a field added to the data later can't leak by accident.
 */
export const PUBLIC_FIELDS = ['id', 'name', 'age', 'photo', 'bio', 'college', 'city', 'interests'];

export const ACTIONS = ['like', 'pass'];

export class DiscoverError extends Error {
  constructor(code, status, message) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function toPublic(profile) {
  const out = {};
  for (const key of PUBLIC_FIELDS) {
    if (profile[key] !== undefined) out[key] = profile[key];
  }
  return out;
}

/** Profiles the user has not swiped on yet, in deck order. */
export function getFeed(state, { limit } = {}) {
  const unseen = state.profiles.filter((p) => !state.swipes[p.id]);
  const page = typeof limit === 'number' && limit > 0 ? unseen.slice(0, limit) : unseen;
  return { profiles: page.map(toPublic), remaining: unseen.length };
}

/**
 * Record a like or pass.
 * Returns { matched: false } for a pass or a one-sided like — the response is
 * identical in both cases, so the client can never tell "they liked you but
 * you passed" from "they didn't like you".
 */
export function recordSwipe(state, input, now = new Date()) {
  const { profileId, action } = input ?? {};

  if (typeof profileId !== 'string' || !profileId) {
    throw new DiscoverError('BAD_REQUEST', 400, 'profileId is required');
  }
  if (!ACTIONS.includes(action)) {
    throw new DiscoverError('BAD_REQUEST', 400, 'action must be "like" or "pass"');
  }

  const profile = state.profiles.find((p) => p.id === profileId);
  if (!profile) {
    throw new DiscoverError('NOT_FOUND', 404, 'Profile not found');
  }
  if (state.swipes[profileId]) {
    throw new DiscoverError('ALREADY_SWIPED', 409, 'You have already swiped on this profile');
  }

  const at = now.toISOString();
  state.swipes[profileId] = { action, at };

  if (action === 'like' && profile.likesYou === true) {
    state.matches.push({ profileId, matchedAt: at });
    return { matched: true, match: { ...toPublic(profile), matchedAt: at } };
  }
  return { matched: false };
}

/** Mutual matches only, newest first. */
export function getMatches(state) {
  const byId = new Map(state.profiles.map((p) => [p.id, p]));
  return state.matches
    .filter((m) => byId.has(m.profileId) && state.swipes[m.profileId]?.action === 'like')
    .map((m) => ({ ...toPublic(byId.get(m.profileId)), matchedAt: m.matchedAt }))
    .sort((a, b) => b.matchedAt.localeCompare(a.matchedAt));
}
