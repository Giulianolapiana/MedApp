import { Hono } from 'hono';
import { db } from '../../core/database.js';
import { backupsAuditoria } from '../../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { authMiddleware, AuthUser } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/require-role.js';

const backupsRouter = new Hono();

// GET /api/v1/backups — ADMIN
backupsRouter.get('/', authMiddleware, requireRole(['ADMINISTRADOR']), async (c) => {
  const user = c.get('user' as never) as AuthUser;
  
  const results = await db
    .select()
    .from(backupsAuditoria)
    .where(eq(backupsAuditoria.clinica_id, user.clinica_id))
    .orderBy(desc(backupsAuditoria.creado_en));
    
  return c.json({ data: results });
});

export default backupsRouter;
