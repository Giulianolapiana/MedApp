import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL);

async function run() {
  await sql`DELETE FROM log_comunicacion WHERE tipo='recordatorio';`;
  console.log('Borrados');
  process.exit(0);
}
run();
