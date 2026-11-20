# IDE_GUIDE.md: Coy Discover

> Drop this file into the repo root. Cursor, Claude Code, Copilot, Windsurf and similar tools pick it up as project context (you can also rename it to `AGENTS.md`, `CLAUDE.md` or `.cursorrules`). It is also your own walkthrough of how everything works, which helps in the interview.

---

## 1. What this project is

A standalone **Next.js 15 (App Router)** app that adds a Tinder- or Bumble-style **Discover** tab next to a blank **Home** tab, for Coy, a privacy-first crush app.

**The one rule that matters:** *never reveal who liked the user unless the like is mutual.* Every change has to keep that rule.

- Frontend: React 19 client components with plain CSS (no Tailwind and no UI library)
- Backend: Next.js route handlers (`app/api/*/route.js`)
- Data: a JSON file (`data/db.json`), auto-created from `data/seed.js`
- Tests: Node's built-in test runner (`node:test`), no Jest
- Auth: none. A single logged-in user ("me") is assumed

## 2. Commands

```bash
npm install
npm run dev     # localhost:3000
npm test        # must stay green before every commit
npm run reset   # restore seed data
npm run build   # production build check
```

## 3. Architecture

```
Browser (DiscoverTab)
   │  fetch /api/feed, /api/swipe, /api/matches
   ▼
Route handlers (app/api/*/route.js)   ← thin: parse request → call lib → format response
   │  withDb(fn, { write })
   ▼
lib/db.js        ← load JSON → run fn → save (atomic) ; one promise queue
   │
   ▼
lib/discover.js  ← PURE logic: getFeed, recordSwipe, getMatches, toPublic
```

**Layering rules (keep them):**
1. `lib/discover.js` is pure: no `fs`, no Next imports, no `Date.now()` hidden inside (time is passed in as `now`). That's why it's easy to test.
2. Route handlers stay thin. They only parse input, call `withDb`, and map `DiscoverError` → HTTP status through `lib/http.js`.
3. Only `lib/db.js` touches the disk. To move to SQLite or Postgres you replace just this file and keep the `withDb(fn, { write })` signature.

### Data shape (`data/db.json`)

```js
{
  version: 1,
  me: { id: 'me', name: 'You' },
  profiles: [{ id, name, age, photo, bio, college, city, interests[], likesYou /* PRIVATE */ }],
  swipes:   { [profileId]: { action: 'like' | 'pass', at: ISOString } },
  matches:  [{ profileId, matchedAt }]
}
```

- `likesYou` simulates "this person already liked me". It is **server-only**.
- `swipes` is keyed by profile id, so a lookup is O(1) and duplicate swipes are easy to detect.

## 4. Privacy invariants (never break these)

| # | Invariant | Enforced in | Test |
|---|---|---|---|
| P1 | Profiles leave the server only through `toPublic()` (a whitelist of `PUBLIC_FIELDS`) | `lib/discover.js` | "toPublic only exposes whitelisted fields" |
| P2 | The feed JSON never contains `likesYou` | `getFeed` | "feed payload contains no likesYou field" |
| P3 | A pass and a one-sided like both return exactly `{ matched: false }` | `recordSwipe` | "passing on someone who liked you looks identical…" |
| P4 | A profile can be swiped once only (409 after that), so pass→like can't be used to probe | `recordSwipe` | "a rejected re-swipe cannot turn a pass into a match" |
| P5 | `/matches` returns mutual likes only | `getMatches` | "matches list never includes people who liked you…" |
| P6 | Deck order doesn't group the likers together | `shuffled()` in seed | (by design) |

**When adding any new field or endpoint:** if it's about a profile, add the field to `PUBLIC_FIELDS` only when it's genuinely public. Never return raw profile objects.

## 5. File-by-file

| File | Role | Key details |
|---|---|---|
| `app/page.js` | Tab shell | `useState('discover')`; Home is an intentionally empty `<section>` |
| `components/TabBar.js` | Bottom nav | Inline SVG icons; active tab uses ink background with lime text |
| `components/DiscoverTab.js` | Brain of the UI | Loads feed and matches, optimistic swipe, rollback on error, 409 = already done, ←/→ keys, toast, Deck/Matches toggle, empty and error states, reset demo |
| `components/SwipeCard.js` | One card | Pointer Events drag; commits at 110 px **or** a flick > 0.6 px/ms; `fling(dir)` exposed through `useImperativeHandle` so the buttons and keys share the same animation; `onSwipe` fires after the 320 ms exit |
| `components/MatchOverlay.js` | "It's a match!" | Shown only when the API says `matched: true`; Esc closes; autofocuses the main button; CSS confetti and polaroids |
| `components/MatchesList.js` | Mutual list | Relative time, staggered entry animation, empty state with envelope illustration |
| `components/Avatar.js` | Image with fallback | Shows coloured initials if the placeholder photo fails |
| `app/globals.css` | Entire theme | CSS variables at the top; mobile-first; phone frame on ≥640 px; respects `prefers-reduced-motion` |
| `lib/discover.js` | Business logic | `DiscoverError(code, status, msg)` |
| `lib/db.js` | Persistence | `DB_PATH` env override; temp-file + rename; `globalThis.__coyDbQueue` mutex shared across route modules |
| `lib/http.js` | Responses | `Cache-Control: no-store` on everything |
| `data/seed.js` | 32 profiles | 7 with `likesYou: true`; photos from randomuser.me; deterministic shuffle |
| `tests/discover.test.js` | 22 tests | seed, feed, privacy, matching, validation, persistence, concurrency |
| `next.config.mjs` | Rewrites | `/feed` → `/api/feed` and so on, matching the assignment's exact paths |

## 6. Design system

The aim is to avoid looking like a typical dating app (pink or red gradients and glassmorphism).

| Token | Value | Used for |
|---|---|---|
| `--paper` | `#F1EADF` | App background (with dot grid) |
| `--paper-3` | `#FBF7F0` | Card / surface |
| `--ink` | `#1C1A33` | Text, borders, hard shadows, match screen bg |
| `--lime` | `#D7F75B` | **Like**, primary actions, YES stamp |
| `--coral` | `#FF6A4D` | **Pass**, PASS stamp, wordmark dot |
| `--lilac` | `#B7A6F5` | **Mutual / matches**: badge, time pills |
| `--teal` | `#7FD1C1` | Secondary tag tint |

- **Type:** Fraunces (display serif, italic for emphasis), Space Grotesk (UI), JetBrains Mono (tags, counters), loaded with `next/font/google`.
- **Signature details:** 2 px ink borders, `6px 6px 0` hard shadows that "press in" on `:active`, a dashed ticket edge between photo and text, a `№ 01` ticket number, film grain on photos, rotated rubber-stamp YES/PASS labels.

Don't add a CSS framework. New colours go in `:root` first.

## 7. Conventions for the AI and for you

- JavaScript (ESM, `"type": "module"`), no TypeScript. Use `.js` extensions in relative imports inside `lib/` and `data/` (needed by `node --test`).
- Use the `@/` alias only in `app/` and `components/` (Next resolves it, Node tests don't).
- Each new piece of business logic goes into `lib/discover.js` as a pure function and gets a test.
- Client components start with `'use client'`.
- Keep accessibility: buttons need `aria-label`s, dialogs need `role="dialog"` and `aria-modal`, and nothing should depend on hover only.
- Run `npm test` and `npm run build` before committing.

## 8. How the swipe flow works end to end

1. `DiscoverTab` loads `GET /api/feed` → `deck` state. It renders the top 3 cards; only index 0 is interactive.
2. The user drags. `SwipeCard` updates `translate/rotate` every pointer move (no CSS transition while dragging) and fades in the YES or PASS stamp in proportion to `dx`.
3. On release past the threshold, `fling(dir)` sets `leaving`, the card animates off-screen, and after 320 ms `onSwipe('like'|'pass')` runs.
4. `handleSwipe` removes the card from `deck` at once (optimistic), shows a toast, then calls `POST /api/swipe`.
5. The server runs `withDb(recordSwipe, { write: true })`. This validates the input, records the swipe, and, if it's a like **and** `likesYou`, pushes a match and returns `{ matched: true, match }`.
6. If `matched` is true, the client adds the profile to `matches` and opens `MatchOverlay`.
7. On a network or server error, the card is put back at the top. On 409 the client does nothing (the swipe was already recorded).
8. Reloading the page refetches from disk, so swiped cards stay gone and matches persist.

## 9. Ideas for extending it (ready-made prompts for your IDE)

1. *"Swap `lib/db.js` for SQLite using `better-sqlite3`, keeping the `withDb(fn, {write})` API and making all tests pass. Use tables `profiles`, `swipes(profile_id PK, action, at)`, `matches(profile_id PK, matched_at)`."*
2. *"Add an Undo button for the last **pass** only (never for likes, because undoing a like after seeing that no match happened would leak information). Add a test for it."*
3. *"Add filters (age range, college) to `GET /feed` as query params, validated in `lib/discover.js`, with tests."*
4. *"Add Playwright e2e tests: swipe right on a liker → match overlay appears; reload → card is gone and the match is listed."*
5. *"Preload the next 2 card images with `new Image()` so swipes never show a blank photo."*

## 10. Interview talking points

- **Why a whitelist instead of `delete profile.likesYou`?** A blacklist fails open. If someone adds a private `phone` field later, a whitelist still hides it.
- **Why is a re-swipe blocked?** Without the rule, a user could pass, then like, then check whether a match appears, which would reveal who liked them. Making swipes final removes that side channel.
- **Why are a pass and a non-match like the same response?** Different shapes or status codes would leak information to anyone reading the network tab.
- **Why a promise-queue mutex?** Two quick swipes would otherwise both read the old file and the second write would erase the first. The concurrency test covers this.
- **Why atomic rename?** If the process crashes halfway through `writeFile`, the result is corrupt JSON. `rename` on the same filesystem is atomic.
- **Why optimistic UI?** Swiping has to feel instant. Rollback handles the rare failure.
- **What would change at scale?** A real database with a unique `(user_id, target_id)` constraint on swipes, a match created in a transaction when the reverse like exists, feed pagination with a cursor, and image CDN preloading.
