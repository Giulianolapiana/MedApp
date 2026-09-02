import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Error handler
import { errorHandler } from './middleware/error-handler.js';

// Routers
import authRouter from './modules/auth/auth.router.js';
import especialidadesRouter from './modules/especialidades/especialidades.router.js';
import profesionalesRouter from './modules/profesionales/profesionales.router.js';
import disponibilidadRouter from './modules/disponibilidad/disponibilidad.router.js';
import pacientesRouter from './modules/pacientes/pacientes.router.js';
import turnosRouter from './modules/turnos/turnos.router.js';
import backupsRouter from './modules/backups/backups.router.js';

const app = new Hono();

// ─── Middlewares globales ───────────────────────────────────────
app.use('*', logger());
app.use('/api/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Error handler global (RFC 7807) ───────────────────────────
app.onError(errorHandler);

// ─── Health check ───────────────────────────────────────────────
app.get('/health', (c) => c.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '1.0.0',
}));

// ─── API v1 Routes ─────────────────────────────────────────────
app.route('/api/v1/auth', authRouter);
app.route('/api/v1/especialidades', especialidadesRouter);
app.route('/api/v1/profesionales', profesionalesRouter);
app.route('/api/v1/disponibilidad', disponibilidadRouter);
app.route('/api/v1/pacientes', pacientesRouter);
app.route('/api/v1/turnos', turnosRouter);
app.route('/api/v1/backups', backupsRouter);

// ─── 404 para rutas no encontradas ─────────────────────────────
app.notFound((c) => c.json({
  type: 'about:blank',
  title: 'Not Found',
  status: 404,
  detail: `La ruta ${c.req.method} ${c.req.path} no existe`,
}, 404));

// ─── Servidor ──────────────────────────────────────────────────
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

console.log(`
╔══════════════════════════════════════════════╗
║         🏥 MedAPP Backend API v1.0          ║
║         Puerto: ${port}                        ║
║         Entorno: ${process.env.NODE_ENV || 'development'}              ║
╚══════════════════════════════════════════════╝

Rutas disponibles:
  POST   /api/v1/auth/login
  POST   /api/v1/auth/registro
  POST   /api/v1/auth/refresh
  POST   /api/v1/auth/logout
  GET    /api/v1/auth/me
  GET    /api/v1/especialidades
  POST   /api/v1/especialidades
  GET    /api/v1/profesionales
  POST   /api/v1/profesionales
  GET    /api/v1/disponibilidad/:profId/dias
  GET    /api/v1/disponibilidad/:profId/slots
  GET    /api/v1/disponibilidad/:profId
  PUT    /api/v1/disponibilidad/:profId
  GET    /api/v1/pacientes
  GET    /api/v1/turnos
  POST   /api/v1/turnos
  PATCH  /api/v1/turnos/:id/estado
  GET    /api/v1/turnos/:id/historial
`);

serve({
  fetch: app.fetch,
  port,
});
