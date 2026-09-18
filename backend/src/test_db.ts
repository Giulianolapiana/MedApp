import { db } from './db/index.js';
import { turnos, pacientes, profesionales } from './db/schema.js';
import { desc } from 'drizzle-orm';

async function main() {
  const latestTurnos = await db.select({
    id: turnos.id,
    fecha: turnos.fecha_hora_inicio,
    estado: turnos.estado,
    paciente: pacientes.nombre_completo,
    medico: profesionales.nombre,
  })
  .from(turnos)
  .leftJoin(pacientes, pacientes.id.eq(turnos.paciente_id))
  .leftJoin(profesionales, profesionales.id.eq(turnos.profesional_id))
  .orderBy(desc(turnos.created_at))
  .limit(3);
  
  console.table(latestTurnos);
  process.exit(0);
}
main();
