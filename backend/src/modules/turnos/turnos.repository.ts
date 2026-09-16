import { eq, and, gte, lte, desc, inArray } from 'drizzle-orm';
import { BaseRepository } from '../../core/base-repository.js';
import { turnos, historialTurnos } from '../../db/schema.js';
import { DrizzleClient, DrizzleTransaction } from '../../core/database.js';

export class TurnosRepository extends BaseRepository<typeof turnos> {
  constructor(db: DrizzleClient | DrizzleTransaction) {
    super(db, turnos, undefined, 'clinica_id');
  }

  async listByClinica(
    clinicaId: string,
    filters: { fecha?: string; fecha_desde?: string; fecha_hasta?: string; profesionalId?: string; estado?: string },
    skip = 0,
    limit = 100
  ) {
    const conditions = [eq(turnos.clinica_id, clinicaId)];

    if (filters.profesionalId) {
      conditions.push(eq(turnos.profesional_id, filters.profesionalId));
    }
    if (filters.estado) {
      conditions.push(eq(turnos.estado, filters.estado as any));
    }
    if (filters.fecha_desde) {
      conditions.push(gte(turnos.fecha_hora_inicio, filters.fecha_desde));
    }
    if (filters.fecha_hasta) {
      conditions.push(lte(turnos.fecha_hora_inicio, filters.fecha_hasta));
    }

    let results = await this.db
      .select({
        id: turnos.id,
        clinica_id: turnos.clinica_id,
        paciente_id: turnos.paciente_id,
        profesional_id: turnos.profesional_id,
        fecha_hora_inicio: turnos.fecha_hora_inicio,
        estado: turnos.estado,
        canal_reserva: turnos.canal_reserva,
        creado_en: turnos.creado_en,
      })
      .from(turnos)
      .where(and(...conditions))
      .orderBy(desc(turnos.creado_en))
      .offset(skip)
      .limit(limit);

    // Filtrar por fecha exacta (legacy)
    if (filters.fecha) {
      results = results.filter((t: any) => t.fecha_hora_inicio.startsWith(filters.fecha!));
    }

    // Como necesitamos `pacientes { nombre_completo }` y `profesionales { nombre, id }`
    // que espera el frontend, los cargaremos temporalmente en memoria o reescribiremos la query
    // usando la API relacional de Drizzle.
    
    // Lo más eficiente para este caso (como no usamos db.query relacional explícitamente en el repo base)
    // es usar la API relacional o hacer los joins.
    const turnosFull = await this.db.query.turnos.findMany({
      where: and(...conditions),
      orderBy: desc(turnos.creado_en),
      limit: limit,
      offset: skip,
      with: {
        paciente: {
          columns: { nombre_completo: true }
        },
        profesional: {
          columns: { id: true, nombre: true }
        }
      }
    });

    let finalResults = turnosFull.map(t => ({
      ...t,
      pacientes: t.paciente,
      profesionales: t.profesional
    }));

    if (filters.fecha) {
      finalResults = finalResults.filter((t: any) => t.fecha_hora_inicio.startsWith(filters.fecha!));
    }

    return finalResults;
  }

  async findConflicto(profesionalId: string, fechaHoraInicio: string) {
    const results = await this.db
      .select()
      .from(turnos)
      .where(
        and(
          eq(turnos.profesional_id, profesionalId),
          eq(turnos.fecha_hora_inicio, fechaHoraInicio)
        )
      );

    // Solo es conflicto si el turno está pendiente o confirmado
    return results.find(t => ['pendiente', 'confirmado'].includes(t.estado)) || null;
  }

  async countByClinica(
    clinicaId: string,
    filters: { fecha?: string; fecha_desde?: string; fecha_hasta?: string; profesionalId?: string; estado?: string }
  ): Promise<number> {
    const conditions = [eq(turnos.clinica_id, clinicaId)];

    if (filters.profesionalId) {
      conditions.push(eq(turnos.profesional_id, filters.profesionalId));
    }
    if (filters.estado) {
      conditions.push(eq(turnos.estado, filters.estado as any));
    }
    if (filters.fecha_desde) {
      conditions.push(gte(turnos.fecha_hora_inicio, filters.fecha_desde));
    }
    if (filters.fecha_hasta) {
      conditions.push(lte(turnos.fecha_hora_inicio, filters.fecha_hasta));
    }

    const results = await this.db
      .select({ id: turnos.id })
      .from(turnos)
      .where(and(...conditions));

    let finalResults = results;
    if (filters.fecha) {
      finalResults = finalResults.filter((t: any) => t.id && false); // Not efficient but legacy `fecha` is rarely used now
    }
    
    return finalResults.length;
  }

  async obtenerTurnosParaRecordatorio(fecha: string) {
    const turnosFull = await this.db.query.turnos.findMany({
      where: inArray(turnos.estado, ['pendiente', 'confirmado']),
      orderBy: desc(turnos.fecha_hora_inicio),
      with: {
        paciente: {
          columns: {
            id: true,
            nombre_completo: true,
            telefono_whatsapp: true,
            email: true,
          },
        },
        profesional: {
          columns: {
            id: true,
            nombre: true,
            especialidad: true,
          },
        },
      },
    });

    const turnosDelDia = turnosFull.filter((t: any) => {
      const fechaTurno = t.fecha_hora_inicio.substring(0, 10);
      return fechaTurno === fecha;
    });

    return turnosDelDia.map((t: any) => {
      let hora = '';
      if (t.fecha_hora_inicio.includes('T')) {
        hora = t.fecha_hora_inicio.split('T')[1].substring(0, 5);
      } else if (t.fecha_hora_inicio.includes(' ')) {
        hora = t.fecha_hora_inicio.split(' ')[1].substring(0, 5);
      }

      return {
        turno_id: t.id,
        fecha_hora_inicio: t.fecha_hora_inicio,
        fecha: t.fecha_hora_inicio.substring(0, 10),
        hora,
        estado: t.estado,
        paciente: {
          id: t.paciente?.id,
          nombre: t.paciente?.nombre_completo,
          telefono: t.paciente?.telefono_whatsapp,
          email: t.paciente?.email,
        },
        profesional: {
          id: t.profesional?.id,
          nombre: t.profesional?.nombre,
          especialidad: t.profesional?.especialidad,
        },
      };
    });
  }

  /**
   * Actualiza un turno sin requerir clinica_id.
   * Uso exclusivo: webhooks de n8n donde solo llega el turno ID.
   * Seguro porque id es UUID primary key.
   */
  async updateWithoutClinica(id: string, data: Partial<{ google_event_id: string }>) {
    const result = await this.db
      .update(turnos)
      .set(data as any)
      .where(eq(turnos.id, id))
      .returning();
    return result[0] || null;
  }
}

export class HistorialTurnosRepository {
  constructor(private db: DrizzleClient | DrizzleTransaction) {}

  /**
   * Registra un cambio de estado (append-only, NUNCA se hace UPDATE/DELETE).
   */
  async registrar(data: {
    turno_id: string;
    estado_desde: string;
    estado_hacia: string;
    usuario_id?: string | null;
    motivo?: string | null;
  }) {
    const result = await this.db
      .insert(historialTurnos)
      .values({
        turno_id: data.turno_id,
        estado_desde: data.estado_desde,
        estado_hacia: data.estado_hacia,
        usuario_id: data.usuario_id ?? null,
        motivo: data.motivo ?? null,
      })
      .returning();
    return result[0];
  }

  async listByTurno(turnoId: string) {
    return await this.db
      .select()
      .from(historialTurnos)
      .where(eq(historialTurnos.turno_id, turnoId))
      .orderBy(desc(historialTurnos.creado_en));
  }
}
