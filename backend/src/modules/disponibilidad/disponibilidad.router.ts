import { Hono } from 'hono';
import { disponibilidadService } from './disponibilidad.service.js';
import { GuardarDisponibilidadRequest } from './disponibilidad.schemas.js';
import { ValidationError } from '../../core/errors.js';
import { authMiddleware, AuthUser } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/require-role.js';

const disponibilidadRouter = new Hono();

// GET /api/v1/disponibilidad/:profId/dias?clinica_id=xxx — Público
// Retorna los días de la semana (0-6) en que el profesional atiende
disponibilidadRouter.get('/:profId/dias', async (c) => {
  const profId = c.req.param('profId')!;
  const clinicaId = c.req.query('clinica_id');

  if (!clinicaId) throw new ValidationError('El parámetro clinica_id es requerido');

  const dias = await disponibilidadService.diasDisponibles(profId, clinicaId);
  return c.json({ data: dias });
});

// GET /api/v1/disponibilidad/:profId/slots?fecha=YYYY-MM-DD&clinica_id=xxx — Público
disponibilidadRouter.get('/:profId/slots', async (c) => {
  const profId = c.req.param('profId')!;
  const fecha = c.req.query('fecha');
  const clinicaId = c.req.query('clinica_id');

  if (!fecha) throw new ValidationError('El parámetro fecha (YYYY-MM-DD) es requerido');
  if (!clinicaId) throw new ValidationError('El parámetro clinica_id es requerido');

  // Validar formato de fecha
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new ValidationError('Formato de fecha inválido. Use YYYY-MM-DD');
  }

  const slots = await disponibilidadService.generarSlots(profId, clinicaId, fecha);
  return c.json({ data: slots });
});

// GET /api/v1/disponibilidad/:profId — Config semanal (ADMIN)
disponibilidadRouter.get('/:profId', authMiddleware, requireRole(['ADMINISTRADOR', 'RECEPCION']), async (c) => {
  const profId = c.req.param('profId')!;
  const result = await disponibilidadService.obtenerConfiguracion(profId);
  return c.json({ data: result });
});

// PUT /api/v1/disponibilidad/:profId — Guardar config semanal (ADMIN)
disponibilidadRouter.put('/:profId', authMiddleware, requireRole(['ADMINISTRADOR']), async (c) => {
  const profId = c.req.param('profId')!;
  const body = await c.req.json();
  const parsed = GuardarDisponibilidadRequest.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
  }

  const user = c.get('user' as never) as AuthUser;
  const result = await disponibilidadService.guardarConfiguracion(profId, user.clinica_id, parsed.data);
  return c.json({ data: result });
});

export default disponibilidadRouter;
