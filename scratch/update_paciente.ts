import { db } from '../backend/src/core/database.js';
import { pacientes } from '../backend/src/core/schema.js';
import { like } from 'drizzle-orm';

async function fix() {
  try {
    const res = await db.update(pacientes).set({ nombre_completo: 'Giuliano La Piana' }).where(like(pacientes.telefono_whatsapp, '%2622617565')).returning();
    console.log('Updated:', res);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

fix();
