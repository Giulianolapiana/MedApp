import postgres from 'postgres';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({path: '.env'});

const sql = postgres(process.env.DATABASE_URL);

async function runSql() {
  try {
    console.log('Cleaning up duplicate patients...');
    await sql.unsafe(`DELETE FROM historial_turnos WHERE turno_id IN (SELECT id FROM turnos WHERE paciente_id IN (SELECT id FROM pacientes WHERE telefono_whatsapp = '2622617565'))`);
    await sql.unsafe(`DELETE FROM turnos WHERE paciente_id IN (SELECT id FROM pacientes WHERE telefono_whatsapp = '2622617565')`);
    await sql.unsafe(`DELETE FROM pacientes WHERE telefono_whatsapp = '2622617565'`);

    const sql1 = fs.readFileSync('sql/2026-09-16_ronda1_integridad.sql', 'utf8').replace(/BEGIN;/gi, '').replace(/COMMIT;/gi, '');
    console.log('Running ronda 1...');
    await sql.unsafe(sql1);
    console.log('Ronda 1 executed successfully.');

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
