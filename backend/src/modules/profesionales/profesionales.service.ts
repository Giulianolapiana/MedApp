import { db } from '../../core/database.js';
import { NotFoundError } from '../../core/errors.js';
import { ProfesionalesRepository } from './profesionales.repository.js';
import { CrearProfesionalType, ActualizarProfesionalType } from './profesionales.schemas.js';

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
    return this.repo.create({
      nombre: data.nombre,
      especialidad: data.especialidad,
      clinica_id: clinicaId,
      usuario_id: data.usuario_id ?? null,
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
