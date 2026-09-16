const postgres = require('postgres');
require('dotenv').config({path: 'backend/.env'});

const sql = postgres(process.env.DATABASE_URL);

async function fix() {
  try {
    await sql`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS consentimiento_en timestamptz`;
    await sql`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS consentimiento_canal text`;
    console.log('Columns added successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

fix();
