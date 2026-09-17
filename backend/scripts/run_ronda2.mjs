import postgres from 'postgres';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({path: '.env'});

const sql = postgres(process.env.DATABASE_URL);

async function runSql() {
  try {
    const sql2 = fs.readFileSync('sql/2026-09-17_ronda2_respaldos.sql', 'utf8').replace(/BEGIN;/gi, '').replace(/COMMIT;/gi, '');
    console.log('Running ronda 2...');
    await sql.unsafe(sql2);
    console.log('Ronda 2 executed successfully.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

runSql();
