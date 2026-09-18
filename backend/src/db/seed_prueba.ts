import { db } from '../core/database.js';
import { clinicas, profesionales, disponibilidad, pacientes, turnos } from './schema.js';

async function seedPrueba() {
  console.log('?? Iniciando seeder de datos de prueba...');

  const clinica = await db.select().from(clinicas).limit(1);
  if (clinica.length === 0) {
    console.log('No hay clinicas. Corré el seed principal primero.');
    process.exit(1);
  }
  const clinicaId = clinica[0].id;

  // Profesionales
  console.log('Creando profesionales...');
  const prof1 = await db.insert(profesionales).values({ nombre: 'Dr. Juan Perez', especialidad: 'Cardiología', clinica_id: clinicaId }).returning();
  const prof2 = await db.insert(profesionales).values({ nombre: 'Dra. Maria Gomez', especialidad: 'Dermatología', clinica_id: clinicaId }).returning();

  // Disponibilidad (Lunes a Viernes de 9 a 17)
  console.log('Creando disponibilidad...');
  for (let i = 1; i <= 5; i++) {
    await db.insert(disponibilidad).values({ profesional_id: prof1[0].id, clinica_id: clinicaId, dia_semana: i, horario_inicio: '09:00', horario_fin: '17:00' });
    await db.insert(disponibilidad).values({ profesional_id: prof2[0].id, clinica_id: clinicaId, dia_semana: i, horario_inicio: '09:00', horario_fin: '17:00' });
  }

  // Pacientes Ficticios
  console.log('Creando pacientes...');
  const p1 = await db.insert(pacientes).values({ nombre_completo: 'Carlos Lopez', telefono_whatsapp: '+5491100001111', clinica_id: clinicaId }).returning();
  const p2 = await db.insert(pacientes).values({ nombre_completo: 'Ana Rodriguez', telefono_whatsapp: '+5491100002222', clinica_id: clinicaId }).returning();
  const p3 = await db.insert(pacientes).values({ nombre_completo: 'Pedro Sanchez', telefono_whatsapp: '+5491100003333', clinica_id: clinicaId }).returning();
  const p4 = await db.insert(pacientes).values({ nombre_completo: 'Laura Fernandez', telefono_whatsapp: '+5491100004444', clinica_id: clinicaId }).returning();
  
  // Paciente Giuliano
  const pGiuliano = await db.insert(pacientes).values({ nombre_completo: 'Giuliano La Piana', telefono_whatsapp: '+5492622314699', clinica_id: clinicaId }).returning();

  // Fechas (Turnos en diferentes estados)
  const fechaHoy = new Date();
  
  // Turnos pasados para asistido, cancelado, no_show
  const d1 = new Date(fechaHoy); d1.setDate(d1.getDate() - 2); d1.setHours(10, 0, 0);
  const d2 = new Date(fechaHoy); d2.setDate(d2.getDate() - 3); d2.setHours(11, 0, 0);
  const d3 = new Date(fechaHoy); d3.setDate(d3.getDate() - 4); d3.setHours(12, 0, 0);

  // Turnos futuros para pendiente, confirmado
  const d4 = new Date(fechaHoy); d4.setDate(d4.getDate() + 2); d4.setHours(14, 0, 0);
  const d5 = new Date(fechaHoy); d5.setDate(d5.getDate() + 3); d5.setHours(15, 0, 0);
  
  // Turno mañana para Giuliano (A las 10:00 hora local)
  const dManana = new Date(fechaHoy); 
  dManana.setDate(dManana.getDate() + 1); 
  dManana.setHours(10, 0, 0);

  console.log('Creando turnos...');
  await db.insert(turnos).values([
    { paciente_id: p1[0].id, profesional_id: prof1[0].id, clinica_id: clinicaId, fecha_hora_inicio: d1.toISOString(), fecha_hora_fin: new Date(d1.getTime() + 30*60000).toISOString(), estado: 'asistido', canal_reserva: 'whatsapp' },
    { paciente_id: p2[0].id, profesional_id: prof2[0].id, clinica_id: clinicaId, fecha_hora_inicio: d2.toISOString(), fecha_hora_fin: new Date(d2.getTime() + 30*60000).toISOString(), estado: 'cancelado', canal_reserva: 'web' },
    { paciente_id: p3[0].id, profesional_id: prof1[0].id, clinica_id: clinicaId, fecha_hora_inicio: d3.toISOString(), fecha_hora_fin: new Date(d3.getTime() + 30*60000).toISOString(), estado: 'no_show', canal_reserva: 'whatsapp' },
    { paciente_id: p4[0].id, profesional_id: prof2[0].id, clinica_id: clinicaId, fecha_hora_inicio: d4.toISOString(), fecha_hora_fin: new Date(d4.getTime() + 30*60000).toISOString(), estado: 'pendiente', canal_reserva: 'web' },
    { paciente_id: p1[0].id, profesional_id: prof1[0].id, clinica_id: clinicaId, fecha_hora_inicio: d5.toISOString(), fecha_hora_fin: new Date(d5.getTime() + 30*60000).toISOString(), estado: 'confirmado', canal_reserva: 'whatsapp' },
    { paciente_id: pGiuliano[0].id, profesional_id: prof2[0].id, clinica_id: clinicaId, fecha_hora_inicio: dManana.toISOString(), fecha_hora_fin: new Date(dManana.getTime() + 30*60000).toISOString(), estado: 'pendiente', canal_reserva: 'whatsapp' }
  ]);

  console.log('? Datos de prueba creados exitosamente!');
  process.exit(0);
}
seedPrueba().catch(e => { console.error(e); process.exit(1); });
