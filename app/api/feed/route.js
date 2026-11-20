import { withDb } from '@/lib/db.js';
import { getFeed } from '@/lib/discover.js';
import { ok, fail } from '@/lib/http.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /feed?limit=10 → { profiles: PublicProfile[], remaining: number }
export async function GET(request) {
  try {
    const limitParam = Number(new URL(request.url).searchParams.get('limit'));
    const limit = Number.isInteger(limitParam) && limitParam > 0 ? limitParam : undefined;
    return ok(await withDb((state) => getFeed(state, { limit })));
  } catch (err) {
    return fail(err);
  }
}
