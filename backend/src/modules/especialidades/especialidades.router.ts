import { Hono } from 'hono';
import { especialidadesService } from './especialidades.service.js';
import { CrearEspecialidadRequest, ActualizarEspecialidadRequest } from './especialidades.schemas.js';
import { ValidationError } from '../../core/errors.js';
import { authMiddleware, AuthUser } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/require-role.js';

const especialidadesRouter = new Hono();

// GET /api/v1/especialidades/admin — ADMIN/RECEPCION/PROFESIONAL
especialidadesRouter.get('/admin', authMiddleware, requireRole(['ADMINISTRADOR', 'RECEPCION', 'PROFESIONAL']), async (c) => {
  const user = c.get('user' as never) as AuthUser;
  const result = await especialidadesService.listar(user.clinica_id);
  return c.json({ data: result });
});

// GET /api/v1/especialidades — Público (el frontend paciente necesita listar)
// Pero necesitamos un clinica_id — lo tomamos del query param
especialidadesRouter.get('/', async (c) => {
  const clinicaId = c.req.query('clinica_id');
  if (!clinicaId) {
    throw new ValidationError('clinica_id es requerido como query parameter');
  }
  const result = await especialidadesService.listar(clinicaId);
  return c.json({ data: result });
});

// GET /api/v1/especialidades/:id — Público (pero típicamente admin)
especialidadesRouter.get('/:id', async (c) => {
  const clinicaId = c.req.query('clinica_id');
  if (!clinicaId) throw new ValidationError('clinica_id requerido');
  const id = c.req.param('id')!;
  const result = await especialidadesService.obtener(id, clinicaId);
  return c.json({ data: result });
});

// POST /api/v1/especialidades — Solo ADMIN
especialidadesRouter.post('/', authMiddleware, requireRole(['ADMINISTRADOR']), async (c) => {
  const body = await c.req.json();
  const parsed = CrearEspecialidadRequest.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
  }

  const user = c.get('user' as never) as AuthUser;
  const result = await especialidadesService.crear(parsed.data, user.clinica_id);
  return c.json({ data: result }, 201);
});

// PUT /api/v1/especialidades/:id — Solo ADMIN
especialidadesRouter.put('/:id', authMiddleware, requireRole(['ADMINISTRADOR']), async (c) => {
  const user = c.get('user' as never) as AuthUser;
  const id = c.req.param('id')!;
  const body = await c.req.json();
  const parsed = ActualizarEspecialidadRequest.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
  }

  const result = await especialidadesService.actualizar(id, parsed.data, user.clinica_id);
  return c.json({ data: result });
});

// DELETE /api/v1/especialidades/:id — Solo ADMIN
especialidadesRouter.delete('/:id', authMiddleware, requireRole(['ADMINISTRADOR']), async (c) => {
  const user = c.get('user' as never) as AuthUser;
  const id = c.req.param('id')!;
  await especialidadesService.eliminar(id, user.clinica_id);
  return new Response(null, { status: 204 });
});

export default especialidadesRouter;
