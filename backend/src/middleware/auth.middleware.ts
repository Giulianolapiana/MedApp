import { Context, Next } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { ENV } from '../core/config.js';
import { UnauthorizedError } from '../core/errors.js';
import { db } from '../core/database.js';
import { usuariosAdministrativos } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// Supabase Admin client (con service_role key) para verificar tokens
const supabaseAdmin = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY);

export interface AuthUser {
  id: string;
  email: string;
  clinica_id: string;
  nombre: string;
  rol: 'ADMINISTRADOR' | 'RECEPCION' | 'PROFESIONAL';
}

/**
 * Middleware que verifica el JWT de Supabase Auth y carga el usuario
 * desde nuestra tabla usuarios_administrativos.
 * Setea c.set('user', AuthUser) para que los handlers lo usen.
 */
export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token de autenticación requerido');
  }

  const token = authHeader.slice(7);

  // Verificar el JWT con Supabase
  const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !supabaseUser) {
    throw new UnauthorizedError('Token inválido o expirado');
  }

  // Buscar el usuario en nuestra tabla
  const usuarios = await db
    .select()
    .from(usuariosAdministrativos)
    .where(eq(usuariosAdministrativos.id, supabaseUser.id))
    .limit(1);

  if (usuarios.length === 0) {
    throw new UnauthorizedError('Usuario no registrado en el sistema');
  }

  const usuario = usuarios[0];

  const authUser: AuthUser = {
    id: usuario.id,
    email: supabaseUser.email || '',
    clinica_id: usuario.clinica_id,
    nombre: usuario.nombre,
    rol: usuario.rol,
  };

  c.set('user', authUser);
  await next();
};
