import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({path: '.env'});

const sql = postgres(process.env.DATABASE_URL);

async function fix() {
  try {
    const result = await sql`UPDATE pacientes SET nombre_completo = 'Giuliano La Piana' WHERE telefono_whatsapp LIKE '%2622617565' RETURNING *`;
    console.log('Pacientes actualizados:', result);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

fix();
