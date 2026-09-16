import { eq, and, gte, lte, lt, gt, desc, asc, inArray, sql } from 'drizzle-orm';
import { BaseRepository } from '../../core/base-repository.js';
import { turnos, historialTurnos, logComunicacion, pacientes } from '../../db/schema.js';
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

  /**
   * Chequeo previo de solapamiento (para dar un mensaje claro al usuario).
   * La garantía real es la restricción EXCLUDE de la base (K-07): este chequeo
   * solo, sin la restricción, sería vulnerable a condiciones de carrera.
   */
  async findConflicto(profesionalId: string, inicioUtc: string, finUtc: string) {
    const results = await this.db
      .select({ id: turnos.id })
      .from(turnos)
      .where(
        and(
          eq(turnos.profesional_id, profesionalId),
          inArray(turnos.estado, ['pendiente', 'confirmado']),
          lt(turnos.fecha_hora_inicio, finUtc),
          gt(turnos.fecha_hora_fin, inicioUtc)
        )
      )
      .limit(1);
    return results[0] ?? null;
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

  /**
   * Turnos activos cuyo inicio cae en [desdeUtc, hastaUtc) y que todavía no
   * recibieron recordatorio (A-05: idempotencia apoyada en log_comunicacion).
   */
  async obtenerTurnosParaRecordatorio(desdeUtc: string, hastaUtc: string) {
    const turnosFull = await this.db.query.turnos.findMany({
      where: and(
        inArray(turnos.estado, ['pendiente', 'confirmado']),
        gte(turnos.fecha_hora_inicio, desdeUtc),
        lt(turnos.fecha_hora_inicio, hastaUtc),
        sql`NOT EXISTS (SELECT 1 FROM log_comunicacion lc WHERE lc.turno_id = ${turnos.id} AND lc.tipo = 'recordatorio')`
      ),
      orderBy: asc(turnos.fecha_hora_inicio),
      with: {
        paciente: { columns: { id: true, nombre_completo: true, telefono_whatsapp: true, email: true } },
        profesional: { columns: { id: true, nombre: true, especialidad: true } },
      },
    });
    return turnosFull;
  }

  /** Próximos turnos activos de un paciente identificado por teléfono (canal WhatsApp). */
  async proximosPorTelefono(clinicaId: string, telefono: string, desdeUtc: string) {
    return this.db
      .select({
        id: turnos.id,
        fecha_hora_inicio: turnos.fecha_hora_inicio,
        estado: turnos.estado,
        profesional_id: turnos.profesional_id,
        paciente_id: turnos.paciente_id,
      })
      .from(turnos)
      .innerJoin(pacientes, eq(pacientes.id, turnos.paciente_id))
      .where(
        and(
          eq(turnos.clinica_id, clinicaId),
          eq(pacientes.telefono_whatsapp, telefono),
          inArray(turnos.estado, ['pendiente', 'confirmado']),
          gte(turnos.fecha_hora_inicio, desdeUtc)
        )
      )
      .orderBy(asc(turnos.fecha_hora_inicio))
      .limit(10);
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

export class LogComunicacionRepository {
  constructor(private db: DrizzleClient | DrizzleTransaction) {}

  /** Inserta un registro; para recordatorios, un duplicado se ignora (índice único parcial). */
  async registrar(data: {
    turno_id: string;
    clinica_id: string;
    tipo: 'recordatorio' | 'confirmacion' | 'cancelacion';
    canal?: string;
    respuesta_paciente?: string | null;
    mensaje_externo_id?: string | null;
    detalle?: string | null;
  }) {
    const result = await this.db
      .insert(logComunicacion)
      .values({ canal: 'whatsapp', ...data })
      .onConflictDoNothing()
      .returning();
    return result[0] ?? null;
  }
}
