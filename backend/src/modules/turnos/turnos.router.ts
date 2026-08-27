import { Hono } from 'hono';
import { turnosService } from './turnos.service.js';
import { CrearTurnoRequest, AvanzarEstadoRequest } from './turnos.schemas.js';
import { ValidationError } from '../../core/errors.js';
import { authMiddleware, AuthUser } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/require-role.js';
import { rateLimiterMiddleware } from '../../middleware/rate-limiter.middleware.js';

const turnosRouter = new Hono();

// GET /api/v1/turnos — ADMIN/RECEPCION
turnosRouter.get('/', authMiddleware, requireRole(['ADMINISTRADOR', 'RECEPCION']), async (c) => {
  const user = c.get('user' as never) as AuthUser;
  const fecha = c.req.query('fecha');
  const fecha_desde = c.req.query('fecha_desde');
  const fecha_hasta = c.req.query('fecha_hasta');
  const profesionalId = c.req.query('profesional_id');
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
  // Compute the stats in the DB
  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfToday = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  // 1. Turnos de hoy
  const turnosHoyCount = await turnosService.contar(user.clinica_id, {
    fecha_desde: startOfToday,
    fecha_hasta: endOfToday,
  });

  // 2. Pendientes globales
  const pendientesCount = await turnosService.contar(user.clinica_id, {
    estado: 'pendiente'
  });

  // 3. No-shows de hoy
  const noShowsCount = await turnosService.contar(user.clinica_id, {
    fecha_desde: startOfToday,
    fecha_hasta: endOfToday,
    estado: 'no_show'
  });

  // 4. Próximos turnos de hoy
  const proximosTurnosResult = await turnosService.listar(user.clinica_id, {
    fecha_desde: new Date().toISOString(),
    fecha_hasta: endOfToday
  }, 1, 5);

  const maxCapacity = 20; // 20 turnos diarios por clínica como base mock
  const validTurnos = turnosHoyCount || 0;
  const ocupacion = validTurnos > 0 ? Math.min(Math.round((validTurnos / maxCapacity) * 100), 100) : 0;

  return c.json({
    data: {
      turnosHoy: validTurnos,
      ocupacion,
      pendientes: pendientesCount || 0,
      noShowsHoy: noShowsCount || 0,
      proximosTurnos: proximosTurnosResult,
    }
  });
});

// GET /api/v1/turnos/:id — ADMIN/RECEPCION
turnosRouter.get('/:id', authMiddleware, requireRole(['ADMINISTRADOR', 'RECEPCION']), async (c) => {
  const user = c.get('user' as never) as AuthUser;
  const id = c.req.param('id')!;
  const turno = await turnosService.obtener(id, user.clinica_id);
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

  const clinicaId = c.req.query('clinica_id');
  if (!clinicaId) {
    throw new ValidationError('clinica_id es requerido como query parameter');
  }

  const result = await turnosService.crear(parsed.data, clinicaId);
  return c.json({ data: result }, 201);
});

// PATCH /api/v1/turnos/:id/estado — ADMIN/RECEPCION (FSM)
turnosRouter.patch('/:id/estado', authMiddleware, requireRole(['ADMINISTRADOR', 'RECEPCION']), async (c) => {
  const id = c.req.param('id')!;
  const body = await c.req.json();
  const parsed = AvanzarEstadoRequest.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
  }

  const user = c.get('user' as never) as AuthUser;
  const result = await turnosService.avanzarEstado(id, parsed.data, user.id, user.clinica_id);
  return c.json({ data: result });
});

export default turnosRouter;
