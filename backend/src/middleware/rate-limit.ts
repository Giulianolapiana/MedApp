import { Context, Next } from 'hono';
import { AppError } from '../core/errors.js';

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitInfo>();

export const rateLimiter = (options: { windowMs: number; max: number; message?: string }) => {
  return async (c: Context, next: Next) => {
    // Intentar obtener IP del cliente
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const now = Date.now();

    const record = store.get(ip);

    if (record) {
      if (now > record.resetTime) {
        // Expiró la ventana, reset
        store.set(ip, { count: 1, resetTime: now + options.windowMs });
      } else {
        if (record.count >= options.max) {
          throw new AppError(options.message || 'Demasiadas solicitudes, intente más tarde', 429, 'TOO_MANY_REQUESTS');
        }
        record.count++;
      }
    } else {
      store.set(ip, { count: 1, resetTime: now + options.windowMs });
    }

    // Limpieza periódica muy básica
    if (Math.random() < 0.01) {
      for (const [key, value] of store.entries()) {
        if (now > value.resetTime) {
          store.delete(key);
        }
      }
    }

    await next();
  };
};
