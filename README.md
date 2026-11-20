# Coy — Discover tab

A swipe-based **Discover** tab built as a standalone Next.js app for the Coy SDE Intern assignment (Part B).
Likes stay sealed: nobody is ever shown as having liked you unless the like is mutual.

![stack](https://img.shields.io/badge/Next.js-15-1C1A33) ![tests](https://img.shields.io/badge/tests-node%3Atest-D7F75B) ![db](https://img.shields.io/badge/db-JSON%20file-B7A6F5)

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 22 tests: feed, swipe, matching, privacy, persistence
npm run reset      # wipe swipes/matches back to the seed data
```

Node 18.18+ is required. No env vars or external services are needed.

## What's included

| Requirement | Where |
|---|---|
| Tab bar with blank **Home** + **Discover** | `app/page.js`, `components/TabBar.js` |
| 32 seeded profiles (name, age, photo, bio, college, city, interests) | `data/seed.js` |
| 7 seeded profiles have already liked you, so matches happen in a demo | `likesYou: true` in `data/seed.js` |
| One card at a time, drag on mobile, buttons + ←/→ keys on desktop | `components/SwipeCard.js`, `components/DiscoverTab.js` |
| Smooth animations, YES/PASS stamps, toast after every swipe | `SwipeCard.js`, `globals.css` |
| A swiped profile never comes back | server filters on `swipes`; tests in `tests/` |
| Empty state when the deck runs out | `DiscoverTab.js` |
| "It's a match!" screen only on a mutual like | `components/MatchOverlay.js` |
| Matches view | `components/MatchesList.js` (Deck / Matches toggle inside Discover) |
| `GET /feed`, `POST /swipe`, `GET /matches` | `app/api/*/route.js` (also reachable without `/api` through rewrites) |
| Persists across reloads | `lib/db.js` → `data/db.json` |

## API

All three paths work with or without the `/api` prefix.

```http
GET /feed?limit=10
→ 200 { "profiles": [ { id, name, age, photo, bio, college, city, interests } ], "remaining": 25 }

POST /swipe   { "profileId": "p04", "action": "like" | "pass" }
→ 200 { "matched": false }
→ 200 { "matched": true, "match": { ...profile, "matchedAt": "2026-11-20T14:31:00.000Z" } }
→ 400 bad body · 404 unknown profile · 409 already swiped

GET /matches
→ 200 { "matches": [ { ...profile, "matchedAt" } ] }   // newest first
```

`POST /api/reset` restores the seed data (demo helper; it is turned off in production unless `ALLOW_RESET=true`).

## How privacy is enforced

Coy's core promise is that you never learn who liked you unless it's mutual. The app enforces that on the server, not only in the UI:

1. **Whitelist serializer.** Every profile leaves the server through `toPublic()`, which copies only the listed public fields. The private `likesYou` flag can't leak, and a private field added later can't leak by accident either.
2. **The same response for a pass and for a one-sided like.** `POST /swipe` returns `{ matched: false }` in both cases. Passing on someone who liked you looks exactly like passing on someone who didn't.
3. **No ordering signal.** The seed deck is shuffled, so people who liked you aren't grouped at the top of the feed.
4. **Swipes are final.** A second swipe on the same profile returns `409`. Without this rule you could pass on someone, then like them, and use the result to find out whether they liked you.
5. **The matches view is mutual-only.** It lists a profile only if both sides liked each other.

Each rule has a test in `tests/discover.test.js`.

## Design notes

- **Look:** a "paper & ink" theme: parchment cards, midnight-indigo ink, chartreuse for yes, coral for pass, lilac for mutual. It uses hard offset shadows, dashed "ticket" edges and editorial serif type (Fraunces), so it doesn't look like the usual pink-gradient dating app.
- **Gestures:** built on plain Pointer Events, so mouse, touch and pen all work with no gesture library. A swipe commits after 110 px of drag or a fast flick.
- **Optimistic UI:** the card leaves the deck at once. If the request fails, the card comes back and a toast asks you to retry. A `409` (already swiped, for example in another tab) is treated as done.
- **Storage:** a JSON file with atomic writes (temp file, then rename). All access goes through one promise queue, so two quick swipes can't overwrite each other.

## Deploying

The app runs anywhere that has a writable disk (Railway, Render, a VPS). On Vercel the filesystem is read-only except `/tmp`, so set `DB_PATH=/tmp/db.json`. Data there can be wiped between cold starts, so for a durable deployment swap `lib/db.js` for SQLite or Postgres. The rest of the code only uses `withDb()`, so nothing else has to change.

## Project layout

```
app/
  page.js              tab shell (Home | Discover)
  layout.js            fonts + metadata
  globals.css          the whole theme
  api/feed|swipe|matches|reset/route.js
components/
  DiscoverTab.js       state, fetches, keyboard, toasts
  SwipeCard.js         drag physics + exit animation
  MatchOverlay.js      "It's a match!"
  MatchesList.js       mutual matches + empty state
  TabBar.js, Avatar.js
lib/
  discover.js          pure logic: getFeed, recordSwipe, getMatches, toPublic
  db.js                JSON persistence, atomic writes, serialized access
  http.js              JSON response helpers
data/seed.js           32 profiles (7 already like you)
tests/discover.test.js node:test suite
```
