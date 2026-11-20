// `npm run reset` — wipe swipes/matches and restore the seed profiles.
import { resetDb } from '../lib/db.js';

await resetDb();
console.log('Database reset to seed data.');
