import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../../core/database.js';
import { backupsAuditoria, clinicas } from '../../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { authMiddleware, AuthUser } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/require-role.js';
import { apiKeyMiddleware } from '../../middleware/api-key.js';
import { ValidationError } from '../../core/errors.js';

/**
 * Registro de respaldos (hallazgos A-07 y K-08).
 *
 * Dos artefactos distintos:
 *  - respaldo_bd: volcado pg_dump de toda la base, generado por la tarea programada
 *    del VPS (backend/respaldo). Contiene datos de todas las clínicas, por lo que NO
 *    se descarga desde el panel: el panel solo muestra su estado. La restauración la
 *    ejecuta el operador de la plataforma.
 *  - tablero_agenda: planilla de Google Sheets con la agenda de cada clínica, generada
 *    por n8n como herramienta de contingencia. Su enlace sí se muestra en el panel.
 */
const backupsRouter = new Hono();

const Registro = z.object({
  clinica_id: z.string().uuid().optional(),     // sin clinica_id: se registra para todas
  tipo_artefacto: z.enum(['respaldo_bd', 'tablero_agenda']),
  tipo_ejecucion: z.enum(['automatica', 'manual']).default('automatica'),
  estado: z.enum(['completado', 'fallido']),
  archivo_ruta: z.string().max(500).optional(),
  archivo_url: z.string().url().optional(),
  tamano_bytes: z.number().int().nonnegative().optional(),
  detalle: z.string().max(1000).optional(),
});

// POST /api/v1/backups/registro — tarea de respaldo o n8n (x-api-key)
backupsRouter.post('/registro', apiKeyMiddleware, async (c) => {
  const parsed = Registro.safeParse(await c.req.json());
  if (!parsed.success) throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
  const { clinica_id, ...datos } = parsed.data;

  const destino = clinica_id
    ? [clinica_id]
    : (await db.select({ id: clinicas.id }).from(clinicas)).map((x) => x.id);

  // El enlace a la planilla es por clínica; la ruta del volcado nunca se expone al panel
  const filas = destino.map((id) => ({ ...datos, clinica_id: id }));
  const creados = filas.length ? await db.insert(backupsAuditoria).values(filas).returning({ id: backupsAuditoria.id }) : [];
  return c.json({ data: { registrados: creados.length } }, 201);
});

// GET /api/v1/backups — ADMIN: historial de su clínica (sin rutas internas)
backupsRouter.get('/', authMiddleware, requireRole(['ADMINISTRADOR']), async (c) => {
  const user = c.get('user' as never) as AuthUser;
  const results = await db
    .select({
      id: backupsAuditoria.id,
      tipo_artefacto: backupsAuditoria.tipo_artefacto,
      tipo_ejecucion: backupsAuditoria.tipo_ejecucion,
      estado: backupsAuditoria.estado,
      archivo_url: backupsAuditoria.archivo_url,
      tamano_bytes: backupsAuditoria.tamano_bytes,
      detalle: backupsAuditoria.detalle,
      creado_en: backupsAuditoria.creado_en,
    })
    .from(backupsAuditoria)
    .where(eq(backupsAuditoria.clinica_id, user.clinica_id))
    .orderBy(desc(backupsAuditoria.creado_en))
    .limit(100);

  return c.json({ data: results });
});

export default backupsRouter;
