import { Hono } from 'hono';
import { turnosService } from './turnos.service.js';
import { CrearTurnoRequest, AvanzarEstadoRequest } from './turnos.schemas.js';
import { ValidationError } from '../../core/errors.js';
import { authMiddleware, AuthUser } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/require-role.js';
import { rateLimiterMiddleware } from '../../middleware/rate-limiter.middleware.js';
import { ENV } from '../../core/config.js';

const turnosRouter = new Hono();

// GET /api/v1/turnos/recordatorios — N8N Cron
turnosRouter.get('/recordatorios', async (c) => {
  const apiKey = c.req.header('x-api-key');
  if (!apiKey || apiKey !== ENV.N8N_API_KEY) {
    return c.json({ error: 'No autorizado. Api Key inválida.' }, 401);
  }

  const fecha = c.req.query('fecha');
  const data = await turnosService.obtenerTurnosParaRecordatorio(fecha);
  return c.json({ data, total: data.length });
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
  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfToday = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  // 1. Estadísticas detalladas de hoy
  const statsHoy = await turnosService.getStats(user.clinica_id, startOfToday, endOfToday);

  // 2. Próximos turnos de hoy
  const proximosTurnosResult = await turnosService.listar(user.clinica_id, {
    fecha_desde: new Date().toISOString(),
    fecha_hasta: endOfToday
  }, 1, 5);

  const maxCapacity = 20; // mock de capacidad diaria
  const ocupacion = statsHoy.total > 0 ? Math.min(Math.round((statsHoy.total / maxCapacity) * 100), 100) : 0;

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
  console.log('>>> POST /turnos received URL:', c.req.url, 'query clinica_id:', c.req.query('clinica_id'), 'body clinica_id:', body.clinica_id);
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
// No requiere authMiddleware porque lo llama n8n (podríamos usar un secret token)
turnosRouter.patch('/:id/google-event', async (c) => {
  const id = c.req.param('id')!;
  const body = await c.req.json();
  
  if (!body.google_event_id) {
    throw new ValidationError('google_event_id es requerido');
  }

  // TODO: validate security token from n8n if needed

  await turnosService.updateGoogleEventId(id, body.google_event_id);
  return c.json({ success: true });
});

export default turnosRouter;
