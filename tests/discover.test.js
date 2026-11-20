import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

import { buildSeedState, SEED_PROFILES } from '../data/seed.js';
import { getFeed, recordSwipe, getMatches, toPublic, PUBLIC_FIELDS } from '../lib/discover.js';

const liker = (s) => s.profiles.find((p) => p.likesYou);
const nonLiker = (s) => s.profiles.find((p) => !p.likesYou);

describe('seed data', () => {
  test('has at least 30 profiles with all required fields', () => {
    assert.ok(SEED_PROFILES.length >= 30);
    for (const p of SEED_PROFILES) {
      for (const f of PUBLIC_FIELDS) assert.ok(p[f] !== undefined, `${p.id} missing ${f}`);
      assert.ok(Array.isArray(p.interests) && p.interests.length > 0);
    }
  });

  test('some (but not all) profiles already like the user', () => {
    const n = SEED_PROFILES.filter((p) => p.likesYou).length;
    assert.ok(n >= 3 && n < SEED_PROFILES.length);
  });

  test('ids are unique', () => {
    assert.equal(new Set(SEED_PROFILES.map((p) => p.id)).size, SEED_PROFILES.length);
  });
});

describe('feed', () => {
  let state;
  beforeEach(() => (state = buildSeedState()));

  test('returns every profile before any swipe', () => {
    assert.equal(getFeed(state).profiles.length, state.profiles.length);
  });

  test('never returns a profile that was swiped on (like or pass)', () => {
    const [a, b] = state.profiles;
    recordSwipe(state, { profileId: a.id, action: 'like' });
    recordSwipe(state, { profileId: b.id, action: 'pass' });
    const ids = getFeed(state).profiles.map((p) => p.id);
    assert.ok(!ids.includes(a.id) && !ids.includes(b.id));
    assert.equal(getFeed(state).remaining, state.profiles.length - 2);
  });

  test('is empty once everyone is swiped', () => {
    for (const p of state.profiles) recordSwipe(state, { profileId: p.id, action: 'pass' });
    assert.deepEqual(getFeed(state), { profiles: [], remaining: 0 });
  });

  test('respects limit', () => {
    assert.equal(getFeed(state, { limit: 5 }).profiles.length, 5);
  });
});

describe('privacy: likes are never revealed unless mutual', () => {
  let state;
  beforeEach(() => (state = buildSeedState()));

  test('feed payload contains no likesYou field anywhere', () => {
    const json = JSON.stringify(getFeed(state));
    assert.ok(!json.includes('likesYou'));
  });

  test('toPublic only exposes whitelisted fields', () => {
    const out = toPublic({ ...state.profiles[0], secret: 'x', phone: '999' });
    assert.deepEqual(Object.keys(out).sort(), [...PUBLIC_FIELDS].sort());
  });

  test('passing on someone who liked you looks identical to passing on anyone', () => {
    const a = recordSwipe(state, { profileId: liker(state).id, action: 'pass' });
    const b = recordSwipe(state, { profileId: nonLiker(state).id, action: 'pass' });
    assert.deepEqual(a, b);
    assert.deepEqual(a, { matched: false });
  });

  test('a one-sided like returns the same shape as a pass', () => {
    const r = recordSwipe(state, { profileId: nonLiker(state).id, action: 'like' });
    assert.deepEqual(r, { matched: false });
  });

  test('match payload does not include private fields', () => {
    const r = recordSwipe(state, { profileId: liker(state).id, action: 'like' });
    assert.ok(!JSON.stringify(r).includes('likesYou'));
  });

  test('matches list never includes people who liked you but you have not liked', () => {
    assert.deepEqual(getMatches(state), []);
    recordSwipe(state, { profileId: liker(state).id, action: 'pass' });
    assert.deepEqual(getMatches(state), []);
  });
});

describe('matching', () => {
  let state;
  beforeEach(() => (state = buildSeedState()));

  test('liking someone who liked you creates a match', () => {
    const p = liker(state);
    const r = recordSwipe(state, { profileId: p.id, action: 'like' }, new Date('2026-11-20T10:00:00Z'));
    assert.equal(r.matched, true);
    assert.equal(r.match.id, p.id);
    assert.equal(r.match.matchedAt, '2026-11-20T10:00:00.000Z');
    assert.deepEqual(getMatches(state).map((m) => m.id), [p.id]);
  });

  test('matches are newest first', () => {
    const [p1, p2] = state.profiles.filter((p) => p.likesYou);
    recordSwipe(state, { profileId: p1.id, action: 'like' }, new Date('2026-11-20T10:00:00Z'));
    recordSwipe(state, { profileId: p2.id, action: 'like' }, new Date('2026-11-20T11:00:00Z'));
    assert.deepEqual(getMatches(state).map((m) => m.id), [p2.id, p1.id]);
  });
});

describe('validation', () => {
  let state;
  beforeEach(() => (state = buildSeedState()));

  test('rejects a second swipe on the same profile (409)', () => {
    const id = state.profiles[0].id;
    recordSwipe(state, { profileId: id, action: 'pass' });
    assert.throws(() => recordSwipe(state, { profileId: id, action: 'like' }), { status: 409 });
  });

  test('a rejected re-swipe cannot turn a pass into a match', () => {
    const id = liker(state).id;
    recordSwipe(state, { profileId: id, action: 'pass' });
    assert.throws(() => recordSwipe(state, { profileId: id, action: 'like' }));
    assert.deepEqual(getMatches(state), []);
  });

  test('rejects unknown profile (404)', () => {
    assert.throws(() => recordSwipe(state, { profileId: 'nope', action: 'like' }), { status: 404 });
  });

  test('rejects bad action / missing id / empty body (400)', () => {
    const id = state.profiles[0].id;
    assert.throws(() => recordSwipe(state, { profileId: id, action: 'superlike' }), { status: 400 });
    assert.throws(() => recordSwipe(state, { action: 'like' }), { status: 400 });
    assert.throws(() => recordSwipe(state, undefined), { status: 400 });
  });
});

describe('persistence (JSON file)', () => {
  test('swipes and matches survive a reload of the store', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'coy-'));
    process.env.DB_PATH = path.join(dir, 'db.json');
    const { withDb, resetDb } = await import('../lib/db.js');

    await resetDb();
    const target = await withDb((s) => liker(s).id);
    const res = await withDb((s) => recordSwipe(s, { profileId: target, action: 'like' }), { write: true });
    assert.equal(res.matched, true);

    // Read straight from disk, as a fresh server process would.
    const onDisk = JSON.parse(await fs.readFile(process.env.DB_PATH, 'utf8'));
    assert.equal(onDisk.swipes[target].action, 'like');
    assert.deepEqual(getMatches(onDisk).map((m) => m.id), [target]);
    assert.ok(!getFeed(onDisk).profiles.some((p) => p.id === target));
  });

  test('a failed swipe does not write anything', async () => {
    const { withDb } = await import('../lib/db.js');
    const before = await fs.readFile(process.env.DB_PATH, 'utf8');
    await assert.rejects(withDb((s) => recordSwipe(s, { profileId: 'ghost', action: 'like' }), { write: true }));
    assert.equal(await fs.readFile(process.env.DB_PATH, 'utf8'), before);
  });

  test('concurrent swipes are serialized (no lost updates)', async () => {
    const { withDb, resetDb } = await import('../lib/db.js');
    await resetDb();
    const ids = await withDb((s) => s.profiles.slice(0, 10).map((p) => p.id));
    await Promise.all(
      ids.map((id) => withDb((s) => recordSwipe(s, { profileId: id, action: 'pass' }), { write: true }))
    );
    const onDisk = JSON.parse(await fs.readFile(process.env.DB_PATH, 'utf8'));
    assert.equal(Object.keys(onDisk.swipes).length, 10);
  });
});
