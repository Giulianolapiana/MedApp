import { createClient } from '@supabase/supabase-js';
import { ENV } from '../../core/config.js';
import { db } from '../../core/database.js';
import { usuariosAdministrativos } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { UnauthorizedError } from '../../core/errors.js';
import { LoginRequestType, RefreshRequestType } from './auth.schemas.js';

const supabaseAdmin = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY);

export class AuthService {
  async login(data: LoginRequestType) {
    // Autenticar contra Supabase Auth
    const { data: authData, error } = await supabaseAdmin.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error || !authData.session) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Buscar perfil en nuestra tabla
    const usuarios = await db
      .select()
      .from(usuariosAdministrativos)
      .where(eq(usuariosAdministrativos.id, authData.user.id))
      .limit(1);

    if (usuarios.length === 0) {
      throw new UnauthorizedError('Usuario no tiene perfil administrativo');
    }

    const usuario = usuarios[0];

    return {
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      user: {
        id: usuario.id,
        email: authData.user.email || '',
        nombre: usuario.nombre,
        rol: usuario.rol,
        clinica_id: usuario.clinica_id,
      },
    };
  }

  async refresh(data: RefreshRequestType) {
    const { data: authData, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: data.refresh_token,
    });

    if (error || !authData.session) {
      throw new UnauthorizedError('Refresh token inválido o expirado');
    }

    return {
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    };
  }

  async me(userId: string) {
    const usuarios = await db
      .select()
      .from(usuariosAdministrativos)
      .where(eq(usuariosAdministrativos.id, userId))
      .limit(1);

    if (usuarios.length === 0) {
      throw new UnauthorizedError('Usuario no encontrado');
    }

    return usuarios[0];
  }
}

export const authService = new AuthService();
