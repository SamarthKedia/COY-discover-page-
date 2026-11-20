import { withDb } from '@/lib/db.js';
import { getMatches } from '@/lib/discover.js';
import { ok, fail } from '@/lib/http.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /matches → { matches: (PublicProfile & { matchedAt })[] }
export async function GET() {
  try {
    return ok({ matches: await withDb(getMatches) });
  } catch (err) {
    return fail(err);
  }
}
