import { resetDb } from '@/lib/db.js';
import { ok, fail } from '@/lib/http.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/reset → restores the seed data. Demo helper only; disabled in
// production unless ALLOW_RESET=true is set.
export async function POST() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_RESET !== 'true') {
    return Response.json({ error: 'Reset is disabled' }, { status: 403 });
  }
  try {
    await resetDb();
    return ok({ reset: true });
  } catch (err) {
    return fail(err);
  }
}
