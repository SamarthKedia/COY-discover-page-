// Tiny JSON-file "database".
// - Created from the seed on first use, so a fresh clone just works.
// - Writes are atomic (write temp file, then rename) so a crash can't leave
//   half-written JSON behind.
// - All access goes through one promise queue, so two quick swipes can't
//   read-modify-write over each other.

import fs from 'node:fs/promises';
import path from 'node:path';
import { buildSeedState } from '../data/seed.js';

function dbPath() {
  // Read at call time so tests (and hosts like Vercel, which only allow /tmp)
  // can point it elsewhere with DB_PATH.
  return process.env.DB_PATH || path.join(process.cwd(), 'data', 'db.json');
}

// Shared across route modules (Next.js may load each route separately in dev).
const g = globalThis;
g.__coyDbQueue ??= Promise.resolve();

async function save(state) {
  const file = dbPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2));
  await fs.rename(tmp, file);
}

async function load() {
  try {
    return JSON.parse(await fs.readFile(dbPath(), 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      const fresh = buildSeedState();
      await save(fresh);
      return fresh;
    }
    throw err;
  }
}

/**
 * Run `fn(state)` with exclusive access. If `write` is true and `fn` returns
 * without throwing, the (mutated) state is saved.
 */
export function withDb(fn, { write = false } = {}) {
  const run = g.__coyDbQueue.then(async () => {
    const state = await load();
    const result = await fn(state);
    if (write) await save(state);
    return result;
  });
  g.__coyDbQueue = run.catch(() => {}); // keep the queue alive after errors
  return run;
}

export function resetDb() {
  const run = g.__coyDbQueue.then(() => save(buildSeedState()));
  g.__coyDbQueue = run.catch(() => {});
  return run;
}
