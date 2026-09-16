import { eq, and, ilike } from 'drizzle-orm';
import { BaseRepository } from '../../core/base-repository.js';
import { especialidades } from '../../db/schema.js';
import { DrizzleClient, DrizzleTransaction } from '../../core/database.js';

export class EspecialidadesRepository extends BaseRepository<
  typeof especialidades
> {
  constructor(db: DrizzleClient | DrizzleTransaction) {
    super(db, especialidades, undefined, 'clinica_id');
  }

  async listByClinica(clinicaId: string) {
    return await this.db
      .select()
      .from(especialidades)
      .where(eq(especialidades.clinica_id, clinicaId));
  }

  async findByNombre(clinicaId: string, nombre: string) {
    const result = await this.db
      .select()
      .from(especialidades)
      .where(
        and(
          eq(especialidades.clinica_id, clinicaId),
          ilike(especialidades.nombre, nombre)
        )
      )
      .limit(1);
    return result[0] || null;
  }
}
