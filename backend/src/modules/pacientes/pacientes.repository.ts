import { eq, and, ilike } from 'drizzle-orm';
import { BaseRepository } from '../../core/base-repository.js';
import { pacientes } from '../../db/schema.js';
import { DrizzleClient, DrizzleTransaction } from '../../core/database.js';

export class PacientesRepository extends BaseRepository<typeof pacientes> {
  constructor(db: DrizzleClient | DrizzleTransaction) {
    super(db, pacientes, undefined, 'clinica_id');
  }

  async listByClinica(clinicaId: string, skip = 0, limit = 20) {
    return await this.db
      .select()
      .from(pacientes)
      .where(
        and(
          eq(pacientes.clinica_id, clinicaId),
          eq(pacientes.activo, true)
        )
      )
      .offset(skip)
      .limit(limit);
  }

  async search(clinicaId: string, query: string) {
    return await this.db
      .select()
      .from(pacientes)
      .where(
        and(
          eq(pacientes.clinica_id, clinicaId),
          eq(pacientes.activo, true),
          ilike(pacientes.nombre_completo, `%${query}%`)
        )
      )
      .limit(50);
  }

  async findByTelefono(clinicaId: string, telefono: string) {
    const result = await this.db
      .select()
      .from(pacientes)
      .where(
        and(
          eq(pacientes.clinica_id, clinicaId),
          eq(pacientes.telefono_whatsapp, telefono)
        )
      )
      .limit(1);
    return result[0] || null;
  }
}
