import { Hono } from 'hono';
import { profesionalesService } from './profesionales.service.js';
import { CrearProfesionalRequest, ActualizarProfesionalRequest } from './profesionales.schemas.js';
import { ValidationError } from '../../core/errors.js';
import { authMiddleware, AuthUser } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/require-role.js';

const profesionalesRouter = new Hono();

// GET /api/v1/profesionales/admin — ADMIN/RECEPCION/PROFESIONAL
profesionalesRouter.get('/admin', authMiddleware, requireRole(['ADMINISTRADOR', 'RECEPCION', 'PROFESIONAL']), async (c) => {
  const user = c.get('user' as never) as AuthUser;
  const result = await profesionalesService.listar(user.clinica_id);
  return c.json({ data: result });
});

// GET /api/v1/profesionales — Público
profesionalesRouter.get('/', async (c) => {
  const clinicaId = c.req.query('clinica_id');
  if (!clinicaId) {
    throw new ValidationError('clinica_id es requerido como query parameter');
  }
  const especialidad = c.req.query('especialidad');
  const result = await profesionalesService.listar(clinicaId, especialidad || undefined);
  return c.json({ data: result });
});

// GET /api/v1/profesionales/:id — Público (paciente o admin)
profesionalesRouter.get('/:id', async (c) => {
  const clinicaId = c.req.query('clinica_id');
  if (!clinicaId) throw new ValidationError('clinica_id requerido');
  const id = c.req.param('id')!;
  const result = await profesionalesService.obtener(id, clinicaId);
  return c.json({ data: result });
});

// POST /api/v1/profesionales — Solo ADMIN
profesionalesRouter.post('/', authMiddleware, requireRole(['ADMINISTRADOR']), async (c) => {
  const body = await c.req.json();
  const parsed = CrearProfesionalRequest.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
  }

  const user = c.get('user' as never) as AuthUser;
  const result = await profesionalesService.crear(parsed.data, user.clinica_id);
  return c.json({ data: result }, 201);
});

// PUT /api/v1/profesionales/:id — Solo ADMIN
profesionalesRouter.put('/:id', authMiddleware, requireRole(['ADMINISTRADOR']), async (c) => {
  const user = c.get('user' as never) as AuthUser;
  const id = c.req.param('id')!;
  const body = await c.req.json();
  const parsed = ActualizarProfesionalRequest.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
  }

  const result = await profesionalesService.actualizar(id, parsed.data, user.clinica_id);
  return c.json({ data: result });
});

// DELETE /api/v1/profesionales/:id — Solo ADMIN (soft delete)
profesionalesRouter.delete('/:id', authMiddleware, requireRole(['ADMINISTRADOR']), async (c) => {
  const id = c.req.param('id')!;
  await profesionalesService.eliminar(id);
  return c.json({ message: 'Profesional desactivado' });
});

export default profesionalesRouter;
