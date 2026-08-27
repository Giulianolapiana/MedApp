import { Hono } from 'hono';
import { authService } from './auth.service.js';
import { LoginRequest, RefreshRequest } from './auth.schemas.js';
import { ValidationError } from '../../core/errors.js';
import { authMiddleware, AuthUser } from '../../middleware/auth.middleware.js';
import { rateLimiter } from '../../middleware/rate-limit.js';

const auth = new Hono();

// Rate limit en login: 10 intentos cada 15 minutos
auth.post('/login', rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), async (c) => {
  const body = await c.req.json();
  const parsed = LoginRequest.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
  }

  const result = await authService.login(parsed.data);
  return c.json(result);
});

auth.post('/refresh', async (c) => {
  const body = await c.req.json();
  const parsed = RefreshRequest.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
  }

  const result = await authService.refresh(parsed.data);
  return c.json(result);
});

auth.get('/me', authMiddleware, async (c) => {
  const user = c.get('user' as never) as AuthUser;
  const profile = await authService.me(user.id);
  return c.json({ user: profile });
});

export default auth;
