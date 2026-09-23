// Tipos laxos: los módulos se importan de forma diferida en beforeAll.
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Pruebas de integración contra PostgreSQL real (K-07, K-06, A-01, A-05, A-10).
 * Se ejecutan solo con INTEGRACION=1 y una base de PRUEBA con la migración aplicada:
 *   INTEGRACION=1 DATABASE_URL=postgresql://.../medapp_test pnpm test
 */
import { describe, it, expect, beforeAll } from 'vitest';

const activo = process.env.INTEGRACION === '1';

describe.skipIf(!activo)('Integración: turnos contra PostgreSQL', () => {
  // Importaciones diferidas: sin INTEGRACION=1 no se carga la configuración de la base
  let db: any, schema: any, turnosService: any, disponibilidadService: any, sql: any;

  let clinicaId = '';
  let profesionalId = '';
  // Un lunes futuro cualquiera, a las 10:00 hora de Mendoza
  const base = new Date(Date.now() + 14 * 86400000);
  base.setUTCDate(base.getUTCDate() + ((8 - base.getUTCDay()) % 7));
  const fecha = base.toISOString().slice(0, 10);
  const paciente = (n: number) => ({ nombre_completo: `Paciente ${n}`, telefono_whatsapp: `+54926100000${String(n).padStart(2, '0')}` });

  beforeAll(async () => {
    ({ db } = await import('../core/database.js'));
    schema = await import('../db/schema.js');
    ({ turnosService } = await import('../modules/turnos/turnos.service.js'));
    ({ disponibilidadService } = await import('../modules/disponibilidad/disponibilidad.service.js'));
    ({ sql } = await import('drizzle-orm'));
    await db.execute(sql`ALTER TABLE historial_turnos DISABLE TRIGGER trg_historial_inmutable`);
    await db.execute(sql`TRUNCATE log_comunicacion, historial_turnos, turnos, disponibilidad, pacientes, profesionales, especialidades, usuarios_administrativos, backups_auditoria, clinicas CASCADE`);
    await db.execute(sql`ALTER TABLE historial_turnos ENABLE TRIGGER trg_historial_inmutable`);
    const [c] = await db.insert(schema.clinicas).values({ nombre: 'Consultorio de prueba' }).returning();
    const [p] = await db.insert(schema.profesionales).values({ nombre: 'Dra. Prueba', especialidad: 'Clínica', clinica_id: c.id }).returning();
    await db.insert(schema.disponibilidad).values({ profesional_id: p.id, clinica_id: c.id, dia_semana: 1, horario_inicio: '09:00', horario_fin: '12:00' });
    clinicaId = c.id; profesionalId = p.id;
  });

  it('K-07: 20 reservas simultáneas del mismo horario → 1 aceptada, 19 rechazadas con 409', async () => {
    const intentos = Array.from({ length: 20 }, (_, i) =>
      turnosService.crearPublico({ profesional_id: profesionalId, fecha_hora_inicio: `${fecha}T10:00:00`, consentimiento_privacidad: true, paciente: paciente(i) }, clinicaId)
    );
    const r = await Promise.allSettled(intentos);
    const ok = r.filter(x => x.status === 'fulfilled');
    const rechazos = r.filter(x => x.status === 'rejected') as PromiseRejectedResult[];
    expect(ok).toHaveLength(1);
    expect(rechazos).toHaveLength(19);
    expect(rechazos.every(x => x.reason?.statusCode === 409)).toBe(true);
  });

  it('A-01: 10:00 de Mendoza se guarda como 13:00 UTC y el slot 10:00 figura ocupado', async () => {
    const [t] = await db.select().from(schema.turnos);
    expect(new Date(t.fecha_hora_inicio.replace(' ', 'T').replace(/\+00$/, 'Z')).toISOString()).toBe(`${fecha}T13:00:00.000Z`);
    const slots = await disponibilidadService.generarSlots(profesionalId, clinicaId, fecha);
    expect(slots.find((s: any) => s.hora === '10:00')?.disponible).toBe(false);
    expect(slots.find((s: any) => s.hora === '10:30')?.disponible).toBe(true);
  });

  it('A-04: una reserva pública no sobrescribe el nombre de un paciente existente', async () => {
    const tel = paciente(99).telefono_whatsapp;
    await turnosService.crearPublico({ profesional_id: profesionalId, fecha_hora_inicio: `${fecha}T09:00:00`, consentimiento_privacidad: true, paciente: { nombre_completo: 'Nombre Original', telefono_whatsapp: tel } }, clinicaId);
    await turnosService.crearPublico({ profesional_id: profesionalId, fecha_hora_inicio: `${fecha}T11:00:00`, consentimiento_privacidad: true, paciente: { nombre_completo: 'Intruso', telefono_whatsapp: tel, email: 'x@x.com' } }, clinicaId);
    const p = await db.query.pacientes.findFirst({ where: (t: any, { eq }: any) => eq(t.telefono_whatsapp, tel) });
    expect(p?.nombre_completo).toBe('Nombre Original');
  });

  it('K-06: WhatsApp solo puede confirmar turnos del teléfono remitente y queda registrado', async () => {
    const tel = paciente(99).telefono_whatsapp;
    const [propio] = await turnosService.proximosDelPaciente(clinicaId, tel);
    await expect(turnosService.responderDesdeWhatsapp(clinicaId, propio.turno_id, '+5492619999999', 'confirmado')).rejects.toMatchObject({ statusCode: 404 });
    const r = await turnosService.responderDesdeWhatsapp(clinicaId, propio.turno_id, tel, 'confirmado', 'Sí, confirmo');
    expect(r.estado).toBe('confirmado');
    const logs = await db.query.logComunicacion.findMany({ where: (l: any, { eq }: any) => eq(l.turno_id, propio.turno_id) });
    expect(logs.map((l: any) => l.tipo)).toContain('confirmacion');
  });

  it('K-04: cancelar libera el horario y permite reprogramar', async () => {
    const tel = paciente(99).telefono_whatsapp;
    const turnos = await turnosService.proximosDelPaciente(clinicaId, tel);
    const t11 = turnos.find((t: any) => t.cuando.includes('11:00'))!;
    await turnosService.responderDesdeWhatsapp(clinicaId, t11.turno_id, tel, 'cancelado', 'No puedo ir');
    const nuevo = await turnosService.crearWhatsapp({ clinica_id: clinicaId, profesional_id: profesionalId, fecha_hora_inicio: `${fecha}T11:00:00`, nombre_completo: paciente(50).nombre_completo, telefono: paciente(50).telefono_whatsapp });
    expect(nuevo.estado).toBe('pendiente');
  });

  it('K-06/A-02: un turno reservado en la web con "261..." se gestiona desde WhatsApp "+549261..." y guarda el consentimiento', async () => {
    await turnosService.crearPublico({ profesional_id: profesionalId, fecha_hora_inicio: `${fecha}T09:30:00`, consentimiento_privacidad: true, paciente: { nombre_completo: 'Ana Web', telefono_whatsapp: '2614123456' } }, clinicaId);
    const turnos = await turnosService.proximosDelPaciente(clinicaId, '+5492614123456');
    expect(turnos).toHaveLength(1);
    const p = await db.query.pacientes.findFirst({ where: (t: any, { eq }: any) => eq(t.telefono_whatsapp, '+5492614123456') });
    expect(p?.consentimiento_en).toBeTruthy();
    const { ReservaPublicaRequest } = await import('../modules/turnos/turnos.schemas.js');
    expect(ReservaPublicaRequest.safeParse({ profesional_id: profesionalId, fecha_hora_inicio: `${fecha}T11:30:00`, paciente: { nombre_completo: 'Sin Consentimiento', telefono_whatsapp: '2614000000' } }).success).toBe(false);
  });

  it('A-10: la base rechaza transiciones inválidas aunque se salteen la API', async () => {
    const [cancelado] = await db.select().from(schema.turnos).where(sql`estado = 'cancelado'`);
    const error = await db.execute(sql`UPDATE turnos SET estado = 'confirmado' WHERE id = ${cancelado.id}`).then(() => null, (e: any) => e);
    expect(String(error?.cause?.message ?? error?.message)).toMatch(/Transición de estado inválida/);
  });

  it('A-05: el recordatorio de un turno se registra una sola vez', async () => {
    const pendientes = await turnosService.obtenerTurnosParaRecordatorio(fecha);
    expect(pendientes.length).toBeGreaterThan(0);
    const id = pendientes[0].turno_id;
    expect((await turnosService.registrarRecordatorioEnviado(id)).registrado).toBe(true);
    expect((await turnosService.registrarRecordatorioEnviado(id)).duplicado).toBe(true);
    const otraVez = await turnosService.obtenerTurnosParaRecordatorio(fecha);
    expect(otraVez.find((t: any) => t.turno_id === id)).toBeUndefined();
    expect(pendientes[0].cuando).toMatch(/\d{2}:\d{2} hs/);
  });

  it('A2-01: el endpoint público no acepta otro canal ni reservas sin consentimiento; el panel siempre registra canal manual', async () => {
    const { ReservaPublicaRequest } = await import('../modules/turnos/turnos.schemas.js');
    const base = { profesional_id: profesionalId, fecha_hora_inicio: `${fecha}T15:00:00`, paciente: { nombre_completo: 'Canal Falso', telefono_whatsapp: '2614777777' } };
    expect(ReservaPublicaRequest.safeParse({ ...base, consentimiento_privacidad: true, canal_reserva: 'whatsapp' }).success).toBe(false);
    expect(ReservaPublicaRequest.safeParse({ ...base, canal_reserva: 'manual' }).success).toBe(false);
    expect(ReservaPublicaRequest.safeParse({ ...base, consentimiento_privacidad: false }).success).toBe(false);
    const manual = await turnosService.crearManual({ ...base, canal_reserva: 'web' } as any, clinicaId);
    expect(manual.canal_reserva).toBe('manual');
  });

  it('A2-02: un mismo teléfono no puede reservar más de 3 turnos por hora (límite calculado en la base)', async () => {
    const tel = '2614555555';
    for (const h of ['15:30', '16:00', '16:30']) {
      await turnosService.crearWhatsapp({ clinica_id: clinicaId, profesional_id: profesionalId, fecha_hora_inicio: `${fecha}T${h}:00`, nombre_completo: 'Límite', telefono: tel });
    }
    await expect(turnosService.crearWhatsapp({ clinica_id: clinicaId, profesional_id: profesionalId, fecha_hora_inicio: `${fecha}T17:00:00`, nombre_completo: 'Límite', telefono: tel }))
      .rejects.toMatchObject({ statusCode: 429 });
  });

  it('A2-05: un recordatorio fallido no bloquea el reintento y el estado de entrega se actualiza', async () => {
    const pendientes = await turnosService.obtenerTurnosParaRecordatorio(fecha);
    const t = pendientes[0];
    expect(t).toBeTruthy();
    expect((await turnosService.registrarRecordatorioEnviado(t.turno_id, 'msg-falla', 'fallido', 'Meta rechazó el envío')).registrado).toBe(true);
    const otraVez = await turnosService.obtenerTurnosParaRecordatorio(fecha);
    expect(otraVez.find((x: any) => x.turno_id === t.turno_id)).toBeTruthy();
    expect((await turnosService.registrarRecordatorioEnviado(t.turno_id, 'msg-ok')).registrado).toBe(true);
    expect((await turnosService.actualizarEstadoEntrega('msg-ok', 'entregado')).actualizados).toBe(1);
    const log = await db.query.logComunicacion.findFirst({ where: (l: any, { eq }: any) => eq(l.mensaje_externo_id, 'msg-ok') });
    expect(log?.estado_entrega).toBe('entregado');
  });

  it('A2-06: el tablero de agenda se obtiene por la API con fecha y hora de Mendoza', async () => {
    const filas = await turnosService.tablero(clinicaId, 30); // la fecha de prueba está a más de 14 días
    expect(filas.length).toBeGreaterThan(0);
    expect(filas.some((f: any) => f.hora === '10:00')).toBe(true);
  });
});
