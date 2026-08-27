import { Context, Next } from 'hono';

// Simple in-memory store: IP -> { count, timestamp }
const rateLimitStore = new Map<string, { count: number; timestamp: number }>();

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 5; // Max 5 requests per IP per window

export const rateLimiterMiddleware = async (c: Context, next: Next) => {
  // In production, we'd get the real IP from X-Forwarded-For if behind a proxy
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (record) {
    // If we are still in the same window
    if (now - record.timestamp < WINDOW_MS) {
      if (record.count >= MAX_REQUESTS) {
        return c.json({ error: 'Too Many Requests', message: 'Has excedido el límite de reservas. Intenta más tarde.' }, 429);
      }
      record.count++;
    } else {
      // Reset window
      rateLimitStore.set(ip, { count: 1, timestamp: now });
    }
  } else {
    // New IP
    rateLimitStore.set(ip, { count: 1, timestamp: now });
  }

  // Cleanup old entries randomly to prevent memory leak
  if (Math.random() < 0.01) {
    for (const [key, val] of rateLimitStore.entries()) {
      if (now - val.timestamp > WINDOW_MS) {
        rateLimitStore.delete(key);
      }
    }
  }

  await next();
};
