import { db } from '../../core/database.js';
import { NotFoundError, ConflictError } from '../../core/errors.js';
import { EspecialidadesRepository } from './especialidades.repository.js';
import { CrearEspecialidadType, ActualizarEspecialidadType } from './especialidades.schemas.js';

/**
 * Normaliza un nombre a Title Case: primera letra mayúscula, resto minúscula.
 * "PEDIATRIA" -> "Pediatria", "pediatria" -> "Pediatria", "PeDiAtRiA" -> "Pediatria"
 */
function toTitleCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/^\w/, c => c.toUpperCase());
}

export class EspecialidadesService {
  private repo = new EspecialidadesRepository(db);

  async listar(clinicaId: string) {
    return this.repo.listByClinica(clinicaId);
  }

  async obtener(id: string, clinicaId: string) {
    const especialidad = await this.repo.getById(id, clinicaId);
    if (!especialidad) throw new NotFoundError('Especialidad no encontrada');
    return especialidad;
  }

  async crear(data: CrearEspecialidadType, clinicaId: string) {
    const nombreNormalizado = toTitleCase(data.nombre);

    // Verificar que no exista una especialidad con el mismo nombre (case-insensitive)
    const existente = await this.repo.findByNombre(clinicaId, nombreNormalizado);
    if (existente) {
      throw new ConflictError(`La especialidad "${nombreNormalizado}" ya existe`);
    }

    return this.repo.create({
      nombre: nombreNormalizado,
      clinica_id: clinicaId,
    });
  }

  async actualizar(id: string, data: ActualizarEspecialidadType, clinicaId: string) {
    const existing = await this.repo.getById(id, clinicaId);
    if (!existing) throw new NotFoundError('Especialidad no encontrada');

    const updateData = { ...data };
    if (updateData.nombre) {
      updateData.nombre = toTitleCase(updateData.nombre);
    }

    return this.repo.update(id, updateData, clinicaId);
  }

  async eliminar(id: string, clinicaId: string) {
    const existing = await this.repo.getById(id, clinicaId);
    if (!existing) throw new NotFoundError('Especialidad no encontrada');

    await this.repo.hardDelete(id, clinicaId);
  }
}

export const especialidadesService = new EspecialidadesService();
