import { Context, Next } from 'hono';
import { timingSafeEqual } from 'node:crypto';
import { ENV } from '../core/config.js';

/**
 * Autenticación de servicio para llamadas desde n8n (recordatorios, agente
 * conversacional, sincronización de calendario). Comparación en tiempo constante.
 */
export const apiKeyMiddleware = async (c: Context, next: Next) => {
  const recibida = Buffer.from(c.req.header('x-api-key') ?? '');
  const esperada = Buffer.from(ENV.N8N_API_KEY);
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) {
    return c.json({ detail: 'No autorizado', code: 'UNAUTHORIZED' }, 401);
  }
  await next();
};
