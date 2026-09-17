import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({path: '.env'});

const sql = postgres(process.env.DATABASE_URL);

async function runQueries() {
  try {
    console.log('--- Tipo de las columnas de fecha ---');
    const cols = await sql`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = 'turnos' AND column_name LIKE 'fecha%'
    `;
    console.log(cols);

    console.log('\n--- Turnos activos que se solapan ---');
    const overlaps = await sql`
      SELECT a.id as id1, b.id as id2, a.profesional_id, a.fecha_hora_inicio
      FROM turnos a JOIN turnos b
        ON a.profesional_id = b.profesional_id AND a.id < b.id
       AND a.estado IN ('pendiente','confirmado') AND b.estado IN ('pendiente','confirmado')
       AND a.fecha_hora_inicio::timestamptz = b.fecha_hora_inicio::timestamptz
    `;
    console.log(overlaps);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

runQueries();
