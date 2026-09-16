import { Hono } from 'hono';
import { turnosService } from './turnos.service.js';
import { CrearTurnoRequest, AvanzarEstadoRequest } from './turnos.schemas.js';
import { ValidationError } from '../../core/errors.js';
import { authMiddleware, AuthUser } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/require-role.js';
import { rateLimiterMiddleware } from '../../middleware/rate-limiter.middleware.js';
import { apiKeyMiddleware } from '../../middleware/api-key.js';
import { rangoDiaLocal, partesLocales } from '../../core/tiempo.js';
import { z } from 'zod';

const turnosRouter = new Hono();

// GET /api/v1/turnos/recordatorios — N8N Cron
turnosRouter.get('/recordatorios', apiKeyMiddleware, async (c) => {
  const fecha = c.req.query('fecha');
  const data = await turnosService.obtenerTurnosParaRecordatorio(fecha);
  return c.json({ data, total: data.length });
});

// POST /api/v1/turnos/recordatorios/:id/enviado — n8n informa el envío (A-05)
turnosRouter.post('/recordatorios/:id/enviado', apiKeyMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const r = await turnosService.registrarRecordatorioEnviado(c.req.param('id')!, body?.mensaje_externo_id);
  return c.json({ data: r });
});

// ─── Canal WhatsApp: herramientas del agente conversacional (n8n) ─────────
const RespuestaWhatsapp = z.object({
  clinica_id: z.string().uuid(),
  telefono: z.string().min(8),
  accion: z.enum(['confirmado', 'cancelado']),
  mensaje: z.string().max(500).optional(),
});

// GET /api/v1/turnos/whatsapp/mis-turnos?clinica_id=&telefono=
turnosRouter.get('/whatsapp/mis-turnos', apiKeyMiddleware, async (c) => {
  const clinicaId = c.req.query('clinica_id');
  const telefono = c.req.query('telefono');
  if (!clinicaId || !telefono) throw new ValidationError('clinica_id y telefono son requeridos');
  const data = await turnosService.proximosDelPaciente(clinicaId, telefono);
  return c.json({ data, total: data.length });
});

// POST /api/v1/turnos/whatsapp/:id/respuesta — confirmar o cancelar (K-04, K-06)
turnosRouter.post('/whatsapp/:id/respuesta', apiKeyMiddleware, async (c) => {
  const parsed = RespuestaWhatsapp.safeParse(await c.req.json());
  if (!parsed.success) throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
  const { clinica_id, telefono, accion, mensaje } = parsed.data;
  const data = await turnosService.responderDesdeWhatsapp(clinica_id, c.req.param('id')!, telefono, accion, mensaje);
  return c.json({ data });
});

// GET /api/v1/turnos — ADMIN/RECEPCION/PROFESIONAL
turnosRouter.get('/', authMiddleware, requireRole(['ADMINISTRADOR', 'RECEPCION', 'PROFESIONAL']), async (c) => {
  const user = c.get('user' as never) as AuthUser;
  const fecha = c.req.query('fecha');
  const fecha_desde = c.req.query('fecha_desde');
  const fecha_hasta = c.req.query('fecha_hasta');
  // Si es PROFESIONAL, forzar su propio ID, sino usar el del query
  const profesionalId = user.rol === 'PROFESIONAL' ? user.profesional_id : c.req.query('profesional_id');
  const estado = c.req.query('estado');
  const page = parseInt(c.req.query('page') || '1');
  const size = parseInt(c.req.query('size') || '100'); // Increase default size for weekly view

  const result = await turnosService.listar(
    user.clinica_id,
    { fecha, fecha_desde, fecha_hasta, profesionalId, estado },
    page,
    size
  );
  return c.json({ data: result, page, size });
});

// GET /api/v1/turnos/stats — ADMIN
turnosRouter.get('/stats', authMiddleware, requireRole(['ADMINISTRADOR']), async (c) => {
  const user = c.get('user' as never) as AuthUser;
  // Día de hoy en la zona del consultorio, no la del servidor (A-01)
  const hoy = partesLocales(new Date()).fecha;
  const { inicio: startOfToday, fin: endOfToday } = rangoDiaLocal(hoy);

  // 1. Estadísticas detalladas de hoy
  const statsHoy = await turnosService.getStats(user.clinica_id, startOfToday, endOfToday);

  // 2. Próximos turnos de hoy
  const proximosTurnosResult = await turnosService.listar(user.clinica_id, {
    fecha_desde: new Date().toISOString(),
    fecha_hasta: endOfToday
  }, 1, 5);

  // Ocupación real: turnos activos o atendidos / slots ofrecidos hoy según disponibilidad
  const capacidad = await turnosService.capacidadDelDia(user.clinica_id, hoy);
  const ocupados = statsHoy.pendientes + statsHoy.confirmado + statsHoy.asistido + statsHoy.no_show;
  const ocupacion = capacidad > 0 ? Math.min(Math.round((ocupados / capacidad) * 100), 100) : 0;

  return c.json({
    data: {
      turnosHoy: statsHoy.total,
      ocupacion,
      pendientes: statsHoy.pendientes,
      confirmados: statsHoy.confirmado,
      asistidos: statsHoy.asistido,
      noShowsHoy: statsHoy.no_show,
      cancelados: statsHoy.cancelado,
      tasaAsistencia: statsHoy.tasaAsistencia,
      tasaCancelacion: statsHoy.tasaCancelacion,
      capacidad,
      proximosTurnos: proximosTurnosResult,
    }
  });
});

// GET /api/v1/turnos/:id — ADMIN/RECEPCION/PROFESIONAL
turnosRouter.get('/:id', authMiddleware, requireRole(['ADMINISTRADOR', 'RECEPCION', 'PROFESIONAL']), async (c) => {
  const user = c.get('user' as never) as AuthUser;
  const id = c.req.param('id')!;
  const turno = await turnosService.obtener(id, user.clinica_id, user.rol === 'PROFESIONAL' ? user.profesional_id : undefined);
  return c.json({ data: turno });
});

// GET /api/v1/turnos/:id/historial — ADMIN
turnosRouter.get('/:id/historial', authMiddleware, requireRole(['ADMINISTRADOR']), async (c) => {
  const id = c.req.param('id')!;
  const historial = await turnosService.obtenerHistorial(id);
  return c.json({ data: historial });
});

// POST /api/v1/turnos/admin — ADMIN/RECEPCION
turnosRouter.post('/admin', authMiddleware, requireRole(['ADMINISTRADOR', 'RECEPCION']), async (c) => {
  const body = await c.req.json();
  const parsed = CrearTurnoRequest.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
  }

  const user = c.get('user' as never) as AuthUser;
  const result = await turnosService.crear(parsed.data, user.clinica_id);
  return c.json({ data: result }, 201);
});

// POST /api/v1/turnos — Público (el paciente reserva desde el portal)
turnosRouter.post('/', rateLimiterMiddleware, async (c) => {
  const body = await c.req.json();
  const parsed = CrearTurnoRequest.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
  }

  const clinicaId = c.req.query('clinica_id') || body.clinica_id;
  if (!clinicaId) {
    throw new ValidationError('clinica_id es requerido (query parameter o body)');
  }

  const result = await turnosService.crear(parsed.data, clinicaId);
  return c.json({ data: result }, 201);
});

// PATCH /api/v1/turnos/:id/estado — ADMIN/RECEPCION/PROFESIONAL (FSM)
turnosRouter.patch('/:id/estado', authMiddleware, requireRole(['ADMINISTRADOR', 'RECEPCION', 'PROFESIONAL']), async (c) => {
  const id = c.req.param('id')!;
  const body = await c.req.json();
  const parsed = AvanzarEstadoRequest.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
  }

  const user = c.get('user' as never) as AuthUser;
  const result = await turnosService.avanzarEstado(id, parsed.data, user.id, user.clinica_id, user.rol, user.profesional_id);
  return c.json({ data: result });
});

// PATCH /api/v1/turnos/:id/google-event — N8N Webhook Receiver
// Autenticado con x-api-key (antes era público: cualquiera podía modificar turnos)
turnosRouter.patch('/:id/google-event', apiKeyMiddleware, async (c) => {
  const id = c.req.param('id')!;
  const body = await c.req.json();
  
  if (!body.google_event_id) {
    throw new ValidationError('google_event_id es requerido');
  }

  await turnosService.updateGoogleEventId(id, body.google_event_id);
  return c.json({ success: true });
});

export default turnosRouter;
