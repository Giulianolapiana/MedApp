import { Hono } from 'hono';
import { pacientesService } from './pacientes.service.js';
import { ActualizarPacienteRequest } from './pacientes.schemas.js';
import { ValidationError } from '../../core/errors.js';
import { authMiddleware, AuthUser } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/require-role.js';

const pacientesRouter = new Hono();

// GET /api/v1/pacientes — ADMIN/RECEPCION
pacientesRouter.get('/', authMiddleware, requireRole(['ADMINISTRADOR', 'RECEPCION']), async (c) => {
  const user = c.get('user' as never) as AuthUser;
  const search = c.req.query('search');
  const page = parseInt(c.req.query('page') || '1');
  const size = parseInt(c.req.query('size') || '20');

  if (search) {
    const result = await pacientesService.buscar(user.clinica_id, search);
    return c.json({ data: result });
  }

  const result = await pacientesService.listar(user.clinica_id, page, size);
  return c.json({ data: result, page, size });
});

// GET /api/v1/pacientes/:id — ADMIN/RECEPCION
pacientesRouter.get('/:id', authMiddleware, requireRole(['ADMINISTRADOR', 'RECEPCION']), async (c) => {
  const user = c.get('user' as never) as AuthUser;
  const id = c.req.param('id')!;
  const result = await pacientesService.obtener(id, user.clinica_id);
  return c.json({ data: result });
});

// PUT /api/v1/pacientes/:id — ADMIN
pacientesRouter.put('/:id', authMiddleware, requireRole(['ADMINISTRADOR']), async (c) => {
  const user = c.get('user' as never) as AuthUser;
  const id = c.req.param('id')!;
  const body = await c.req.json();
  const parsed = ActualizarPacienteRequest.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
  }

  const result = await pacientesService.actualizar(id, parsed.data, user.clinica_id);
  return c.json({ data: result });
});

export default pacientesRouter;
