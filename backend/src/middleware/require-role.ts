import { Context, Next } from 'hono';
import { ForbiddenError } from '../core/errors.js';
import { AuthUser } from './auth.middleware.js';

type RolUsuario = 'ADMINISTRADOR' | 'RECEPCION' | 'PROFESIONAL';

/**
 * Middleware de RBAC.
 * Uso: requireRole(['ADMINISTRADOR', 'RECEPCION'])
 * Debe usarse DESPUÉS de authMiddleware.
 */
export function requireRole(roles: RolUsuario[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser | undefined;

    if (!user) {
      throw new ForbiddenError('Usuario no autenticado');
    }

    if (!roles.includes(user.rol)) {
      throw new ForbiddenError(`Rol insuficiente. Se requiere: ${roles.join(' o ')}`);
    }

    await next();
  };
}
