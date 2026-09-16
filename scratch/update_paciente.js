const { Client } = require('pg');
require('dotenv').config({path: 'backend/.env'});

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function fix() {
  try {
    await client.connect();
    const res = await client.query("UPDATE pacientes SET nombre_completo = 'Giuliano La Piana' WHERE telefono_whatsapp LIKE '%2622617565' RETURNING *");
    console.log('Pacientes actualizados:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
    process.exit(0);
  }
}

fix();
