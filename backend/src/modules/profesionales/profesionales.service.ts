import { db } from '../../core/database.js';
import { NotFoundError, ValidationError } from '../../core/errors.js';
import { ProfesionalesRepository } from './profesionales.repository.js';
import { CrearProfesionalType, ActualizarProfesionalType } from './profesionales.schemas.js';
import { createClient } from '@supabase/supabase-js';
import { ENV } from '../../core/config.js';
import { usuariosAdministrativos } from '../../db/schema.js';

const supabaseAdmin = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY);

export class ProfesionalesService {
  private repo = new ProfesionalesRepository(db);

  async listar(clinicaId: string, especialidad?: string) {
    if (especialidad) {
      return this.repo.listByClinicaAndEspecialidad(clinicaId, especialidad);
    }
    return this.repo.listByClinica(clinicaId);
  }

  async obtener(id: string, clinicaId: string) {
    const profesional = await this.repo.getById(id, clinicaId);
    if (!profesional) throw new NotFoundError('Profesional no encontrado');
    return profesional;
  }

  async crear(data: CrearProfesionalType, clinicaId: string) {
    let finalUsuarioId = data.usuario_id ?? null;

    if (data.crear_acceso) {
      if (!data.email_acceso || !data.password_acceso) {
        throw new ValidationError('Email y contraseña son requeridos para crear el acceso');
      }

      // Crear en Supabase Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email_acceso,
        password: data.password_acceso,
        email_confirm: true,
      });

      if (authError) {
        if (authError.message.includes('already been registered')) {
          throw new ValidationError('El correo ingresado ya está en uso por otro usuario');
        }
        throw new Error(`Error en Auth: ${authError.message}`);
      }

      if (!authUser.user) {
        throw new Error('No se pudo crear el usuario en Supabase');
      }

      finalUsuarioId = authUser.user.id;

      // Insertar en usuarios_administrativos
      await db.insert(usuariosAdministrativos).values({
        id: finalUsuarioId,
        nombre: data.nombre,
        rol: 'PROFESIONAL',
        clinica_id: clinicaId,
      });
    }

    return this.repo.create({
      nombre: data.nombre,
      especialidad: data.especialidad,
      clinica_id: clinicaId,
      usuario_id: finalUsuarioId,
      google_calendar_id: data.google_calendar_id ?? null,
    });
  }

  async actualizar(id: string, data: ActualizarProfesionalType, clinicaId: string) {
    const existing = await this.repo.getById(id, clinicaId);
    if (!existing) throw new NotFoundError('Profesional no encontrado');

    return this.repo.update(id, data, clinicaId);
  }

  async eliminar(id: string) {
    const existing = await this.repo.getById(id);
    if (!existing) throw new NotFoundError('Profesional no encontrado');
    // Soft delete: desactivar en lugar de borrar
    await this.repo.update(id, { activo: false });
  }
}

export const profesionalesService = new ProfesionalesService();
