import { db } from '../../core/database.js';
import { NotFoundError } from '../../core/errors.js';
import { PacientesRepository } from './pacientes.repository.js';
import { CrearPacienteType, ActualizarPacienteType } from './pacientes.schemas.js';

export class PacientesService {
  private repo = new PacientesRepository(db);

  async listar(clinicaId: string, page = 1, size = 20) {
    const skip = (page - 1) * size;
    return this.repo.listByClinica(clinicaId, skip, size);
  }

  async buscar(clinicaId: string, query: string) {
    return this.repo.search(clinicaId, query);
  }

  async obtener(id: string, clinicaId: string) {
    const paciente = await this.repo.getById(id, clinicaId);
    if (!paciente) throw new NotFoundError('Paciente no encontrado');
    return paciente;
  }

  /**
   * Crea un paciente o devuelve el existente si ya hay uno con ese teléfono.
   * Esto evita duplicados cuando un paciente reserva múltiples turnos.
   */
  async crearOEncontrar(data: CrearPacienteType, clinicaId: string) {
    // Buscar si ya existe por teléfono
    const existente = await this.repo.findByTelefono(clinicaId, data.telefono_whatsapp);
    if (existente) return { paciente: existente, creado: false };

    const nuevo = await this.repo.create({
      nombre_completo: data.nombre_completo,
      telefono_whatsapp: data.telefono_whatsapp,
      email: data.email ?? null,
      fecha_nacimiento: data.fecha_nacimiento ?? null,
      clinica_id: clinicaId,
    });

    return { paciente: nuevo, creado: true };
  }

  async actualizar(id: string, data: ActualizarPacienteType, clinicaId: string) {
    const existing = await this.repo.getById(id, clinicaId);
    if (!existing) throw new NotFoundError('Paciente no encontrado');
    return this.repo.update(id, data, clinicaId);
  }
}

export const pacientesService = new PacientesService();
