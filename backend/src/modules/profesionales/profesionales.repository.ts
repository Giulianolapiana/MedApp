import { eq, and } from 'drizzle-orm';
import { BaseRepository } from '../../core/base-repository.js';
import { profesionales } from '../../db/schema.js';
import { DrizzleClient, DrizzleTransaction } from '../../core/database.js';

export class ProfesionalesRepository extends BaseRepository<typeof profesionales> {
  constructor(db: DrizzleClient | DrizzleTransaction) {
    super(db, profesionales, undefined, 'clinica_id');
  }

  async listByClinica(clinicaId: string, soloActivos = true) {
    const conditions = [eq(profesionales.clinica_id, clinicaId)];
    if (soloActivos) {
      conditions.push(eq(profesionales.activo, true));
    }
    return await this.db
      .select()
      .from(profesionales)
      .where(and(...conditions));
  }

  async listByClinicaAndEspecialidad(clinicaId: string, especialidad: string) {
    return await this.db
      .select()
      .from(profesionales)
      .where(
        and(
          eq(profesionales.clinica_id, clinicaId),
          eq(profesionales.especialidad, especialidad),
          eq(profesionales.activo, true)
        )
      );
  }
}
