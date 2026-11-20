import { withDb } from '@/lib/db.js';
import { recordSwipe, DiscoverError } from '@/lib/discover.js';
import { ok, fail } from '@/lib/http.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /swipe  body: { profileId: string, action: "like" | "pass" }
// → { matched: false } | { matched: true, match: PublicProfile & { matchedAt } }
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail(new DiscoverError('BAD_REQUEST', 400, 'Body must be valid JSON'));
  }
  try {
    return ok(await withDb((state) => recordSwipe(state, body), { write: true }));
  } catch (err) {
    return fail(err);
  }
}
