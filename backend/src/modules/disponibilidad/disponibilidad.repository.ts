import { eq, and } from 'drizzle-orm';
import { BaseRepository } from '../../core/base-repository.js';
import { disponibilidad } from '../../db/schema.js';
import { DrizzleClient, DrizzleTransaction } from '../../core/database.js';

export class DisponibilidadRepository extends BaseRepository<typeof disponibilidad> {
  constructor(db: DrizzleClient | DrizzleTransaction) {
    super(db, disponibilidad);
  }

  async listByProfesional(profesionalId: string) {
    return await this.db
      .select()
      .from(disponibilidad)
      .where(eq(disponibilidad.profesional_id, profesionalId));
  }

  async getByProfesionalAndDia(profesionalId: string, diaSemana: number, clinicaId: string) {
    return await this.db
      .select()
      .from(disponibilidad)
      .where(
        and(
          eq(disponibilidad.profesional_id, profesionalId),
          eq(disponibilidad.dia_semana, diaSemana),
          eq(disponibilidad.clinica_id, clinicaId),
          eq(disponibilidad.habilitado, true)
        )
      );
  }

  async deleteByProfesionalAndClinica(profesionalId: string, clinicaId: string) {
    await this.db
      .delete(disponibilidad)
      .where(
        and(
          eq(disponibilidad.profesional_id, profesionalId),
          eq(disponibilidad.clinica_id, clinicaId)
        )
      );
  }
}
