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
  // user already contains all profile data including profesional_id
  return c.json({ user });
});

// Registro público deshabilitado: las cuentas del personal las crea un administrador.
auth.post('/registro', async (c) => {
  return c.json({ message: 'El registro público está deshabilitado. Solo los administradores pueden crear cuentas.' }, 403);
});

// Endpoint de logout
auth.post('/logout', authMiddleware, async (c) => {
  // Al usar JWT, el logout principal ocurre en el cliente borrando el token.
  // Aquí podríamos invalidar el token en una blacklist si fuera necesario.
  return c.json({ success: true, message: 'Sesión cerrada exitosamente' });
});

export default auth;
