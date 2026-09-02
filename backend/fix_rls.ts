import { sql } from 'drizzle-orm';
import { db } from './src/core/database.js';
import postgres from 'postgres';
import { ENV } from './src/core/config.js';

async function main() {
  console.log('Enabling RLS on historial_turnos...');
  try {
    await db.execute(sql`ALTER TABLE historial_turnos ENABLE ROW LEVEL SECURITY;`);
    console.log('Done!');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

main();
