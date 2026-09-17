import { db } from '../../core/database.js';
import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from '../../core/errors.js';
import { TurnosRepository, HistorialTurnosRepository, LogComunicacionRepository } from './turnos.repository.js';
import { PacientesRepository } from '../pacientes/pacientes.repository.js';
import { validarTransicion, getTransicionesPosibles, EstadoTurno } from './turnos.fsm.js';
import { CrearTurnoType, AvanzarEstadoType } from './turnos.schemas.js';
import { n8nService } from './n8n.service.js';
import { logger } from '../../core/logger.js';
import { traducirErrorPg } from '../../core/pg-errors.js';
import { normalizarTelefonoAR } from '../../core/telefono.js';
import {
  normalizarAUtc, partesLocales, formatoParaPaciente, rangoDiaLocal,
  fechaLocalManana, sumarMinutos, DURACION_TURNO_MINUTOS,
} from '../../core/tiempo.js';

type Filtros = { fecha?: string; fecha_desde?: string; fecha_hasta?: string; profesionalId?: string; estado?: string };

export class TurnosService {
  private repo = new TurnosRepository(db);
  private historialRepo = new HistorialTurnosRepository(db);

  async listar(clinicaId: string, filters: Filtros, page = 1, size = 100) {
    return this.repo.listByClinica(clinicaId, filters, (page - 1) * size, size);
  }

  async obtener(id: string, clinicaId: string, profesionalId?: string) {
    const turno = await this.repo.getById(id, clinicaId);
    if (!turno) throw new NotFoundError('Turno no encontrado');
    if (profesionalId && turno.profesional_id !== profesionalId) {
      throw new ForbiddenError('No tenés permiso para ver este turno');
    }
    return turno;
  }

  async contar(clinicaId: string, filters: Filtros) {
    return this.repo.countByClinica(clinicaId, filters);
  }

  async getStats(clinicaId: string, fecha_desde?: string, fecha_hasta?: string) {
    const filters = { fecha_desde, fecha_hasta };
    const [total, pendientes, confirmado, cancelado, asistido, no_show] = await Promise.all([
      this.repo.countByClinica(clinicaId, filters),
      this.repo.countByClinica(clinicaId, { ...filters, estado: 'pendiente' }),
      this.repo.countByClinica(clinicaId, { ...filters, estado: 'confirmado' }),
      this.repo.countByClinica(clinicaId, { ...filters, estado: 'cancelado' }),
      this.repo.countByClinica(clinicaId, { ...filters, estado: 'asistido' }),
      this.repo.countByClinica(clinicaId, { ...filters, estado: 'no_show' }),
    ]);
    const tasaAsistencia = total > 0 ? Math.round((asistido / total) * 100) : 0;
    const tasaCancelacion = total > 0 ? Math.round((cancelado / total) * 100) : 0;
    return { total, pendientes, confirmado, cancelado, asistido, no_show, tasaAsistencia, tasaCancelacion };
  }

  /** Cantidad de slots ofrecidos en un día local, según la disponibilidad cargada. */
  async capacidadDelDia(clinicaId: string, fechaLocal: string) {
    const [y, m, d] = fechaLocal.split('-').map(Number);
    const diaSemana = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const filas = await db.query.disponibilidad.findMany({
      where: (t, { and, eq }) => and(eq(t.clinica_id, clinicaId), eq(t.dia_semana, diaSemana), eq(t.habilitado, true)),
    });
    const aMin = (h: string) => { const [hh, mm] = h.split(':').map(Number); return hh * 60 + mm; };
    return filas.reduce((acc, f) => acc + Math.max(0, Math.floor((aMin(f.horario_fin) - aMin(f.horario_inicio)) / DURACION_TURNO_MINUTOS)), 0);
  }

  async obtenerHistorial(turnoId: string) {
    return this.historialRepo.listByTurno(turnoId);
  }

  /**
   * Crea un turno en una transacción (UoW):
   * 1. Normaliza la fecha a UTC (A-01) y calcula fecha_hora_fin.
   * 2. Busca o crea el paciente. Por un canal público NO se sobrescriben los
   *    datos de un paciente existente (A-04): solo se completa el email si faltaba.
   * 3. Chequea solapamiento (mensaje amigable) e inserta; la restricción EXCLUDE
   *    de la base es la garantía ante reservas simultáneas (K-07).
   * 4. Registra el alta en el historial append-only.
   */
  async crear(data: CrearTurnoType, clinicaId: string) {
    let inicioUtc: string;
    try {
      inicioUtc = normalizarAUtc(data.fecha_hora_inicio);
    } catch {
      throw new ValidationError('fecha_hora_inicio inválida');
    }
    if (new Date(inicioUtc).getTime() < Date.now()) {
      throw new ValidationError('No se puede reservar un turno en el pasado');
    }
    const finUtc = sumarMinutos(inicioUtc, DURACION_TURNO_MINUTOS);
    let telefono: string;
    try {
      telefono = normalizarTelefonoAR(data.paciente.telefono_whatsapp);
    } catch (e) {
      throw new ValidationError((e as Error).message);
    }
    // A-02: el turnero web exige aceptación expresa de la política de privacidad
    if (data.canal_reserva === 'web' && data.consentimiento_privacidad !== true) {
      throw new ValidationError('Debés aceptar la política de privacidad para reservar');
    }

    let result;
    try {
      result = await db.transaction(async (tx) => {
        const turnosRepoTx = new TurnosRepository(tx);
        const pacientesRepoTx = new PacientesRepository(tx);
        const historialRepoTx = new HistorialTurnosRepository(tx);

        const existente = await pacientesRepoTx.findByTelefono(clinicaId, telefono);
        let pacienteId: string;
        if (existente) {
          pacienteId = existente.id;
          const cambios: Record<string, unknown> = {};
          if (data.paciente.email && !existente.email) cambios.email = data.paciente.email;
          if (data.consentimiento_privacidad && !existente.consentimiento_en) {
            cambios.consentimiento_en = new Date().toISOString();
            cambios.consentimiento_canal = data.canal_reserva;
          }
          if (Object.keys(cambios).length) await pacientesRepoTx.update(pacienteId, cambios);
        } else {
          const nuevo = await pacientesRepoTx.create({
            nombre_completo: data.paciente.nombre_completo,
            telefono_whatsapp: telefono,
            email: data.paciente.email ?? null,
            clinica_id: clinicaId,
            consentimiento_en: data.consentimiento_privacidad ? new Date().toISOString() : null,
            consentimiento_canal: data.consentimiento_privacidad ? data.canal_reserva : null,
          });
          pacienteId = nuevo.id;
        }

        const conflicto = await turnosRepoTx.findConflicto(data.profesional_id, inicioUtc, finUtc);
        if (conflicto) throw new ConflictError('Ya existe un turno en ese horario para este profesional');

        const turno = await turnosRepoTx.create({
          paciente_id: pacienteId,
          profesional_id: data.profesional_id,
          clinica_id: clinicaId,
          fecha_hora_inicio: inicioUtc,
          fecha_hora_fin: finUtc,
          canal_reserva: data.canal_reserva,
        });

        await historialRepoTx.registrar({ turno_id: turno.id, estado_desde: 'nuevo', estado_hacia: 'pendiente' });
        return turno;
      });
    } catch (e) {
      if (e instanceof ConflictError || e instanceof ValidationError) throw e;
      traducirErrorPg(e);
    }

    await this.notificarN8n(result!, 'CREAR', `Reserva ${data.canal_reserva} (nuevo turno)`);
    return result!;
  }

  /**
   * Avanza el estado con la FSM en una transacción (estado + historial).
   * RN-03: motivo obligatorio al cancelar. RN-04: notificación post-commit.
   */
  async avanzarEstado(
    id: string, data: AvanzarEstadoType, userId: string | null, clinicaId: string,
    _userRol?: string, profesionalId?: string,
  ) {
    if (data.nuevo_estado === 'cancelado' && !data.motivo) {
      throw new ValidationError('El motivo es obligatorio al cancelar un turno');
    }

    let result;
    try {
      result = await db.transaction(async (tx) => {
        const turnosRepoTx = new TurnosRepository(tx);
        const historialRepoTx = new HistorialTurnosRepository(tx);

        const turno = await turnosRepoTx.getById(id, clinicaId);
        if (!turno) throw new NotFoundError('Turno no encontrado');
        if (profesionalId && turno.profesional_id !== profesionalId) {
          throw new ForbiddenError('No tenés permiso para modificar este turno');
        }

        const estadoActual = turno.estado as EstadoTurno;
        const nuevoEstado = data.nuevo_estado as EstadoTurno;
        if (!validarTransicion(estadoActual, nuevoEstado)) {
          throw new ConflictError(
            `Transición inválida: ${estadoActual} → ${nuevoEstado}. Permitidas: ${getTransicionesPosibles(estadoActual).join(', ') || 'ninguna (estado terminal)'}`
          );
        }

        const actualizado = await turnosRepoTx.update(id, { estado: nuevoEstado }, clinicaId);
        await historialRepoTx.registrar({
          turno_id: id, estado_desde: estadoActual, estado_hacia: nuevoEstado,
          usuario_id: userId ?? null, motivo: data.motivo ?? null,
        });
        return actualizado!;
      });
    } catch (e) {
      if (e instanceof Error && 'statusCode' in e) throw e;
      traducirErrorPg(e);
    }

    await this.notificarN8n(result!, result!.estado === 'cancelado' ? 'CANCELAR' : 'ACTUALIZAR', data.motivo || 'Sin motivo especificado');
    return result!;
  }

  // ─── Canal WhatsApp (agente conversacional vía n8n) ────────────────────

  /** Próximos turnos activos del paciente que escribe (identificado por su teléfono). */
  async proximosDelPaciente(clinicaId: string, telefono: string) {
    const turnos = await this.repo.proximosPorTelefono(clinicaId, normalizarTelefonoAR(telefono), new Date().toISOString());
    return Promise.all(turnos.map(async (t) => {
      const prof = await db.query.profesionales.findFirst({ where: (p, { eq }) => eq(p.id, t.profesional_id) });
      return {
        turno_id: t.id,
        estado: t.estado,
        cuando: formatoParaPaciente(t.fecha_hora_inicio),
        profesional: prof?.nombre ?? '',
        especialidad: prof?.especialidad ?? '',
      };
    }));
  }

  /**
   * Confirmación o cancelación pedida por el paciente desde WhatsApp.
   * Correlación respuesta–turno (K-06): el turno debe pertenecer al teléfono
   * del remitente, que n8n toma del mensaje entrante y no del texto del LLM.
   */
  async responderDesdeWhatsapp(
    clinicaId: string, turnoId: string, telefono: string,
    accion: 'confirmado' | 'cancelado', mensajePaciente?: string,
  ) {
    const propios = await this.repo.proximosPorTelefono(clinicaId, normalizarTelefonoAR(telefono), new Date().toISOString());
    if (!propios.some((t) => t.id === turnoId)) {
      throw new NotFoundError('No hay un turno activo con ese identificador para este teléfono');
    }
    const actualizado = await this.avanzarEstado(
      turnoId,
      { nuevo_estado: accion, motivo: accion === 'cancelado' ? 'Cancelado por el paciente vía WhatsApp' : undefined },
      null, clinicaId,
    );
    await new LogComunicacionRepository(db).registrar({
      turno_id: turnoId, clinica_id: clinicaId,
      tipo: accion === 'confirmado' ? 'confirmacion' : 'cancelacion',
      respuesta_paciente: mensajePaciente?.slice(0, 500) ?? null,
    });
    return { turno_id: actualizado.id, estado: actualizado.estado, cuando: formatoParaPaciente(actualizado.fecha_hora_inicio) };
  }

  // ─── Recordatorios (WF de n8n programado) ───────────────────────────────

  /** Turnos del día siguiente (hora local del consultorio) sin recordatorio enviado. */
  async obtenerTurnosParaRecordatorio(fecha?: string) {
    const dia = fecha ?? fechaLocalManana();
    const { inicio, fin } = rangoDiaLocal(dia);
    const turnos = await this.repo.obtenerTurnosParaRecordatorio(inicio, fin);
    return turnos.map((t) => {
      const local = partesLocales(t.fecha_hora_inicio);
      return {
        turno_id: t.id,
        clinica_id: t.clinica_id,
        fecha: local.fecha,
        hora: local.hora,
        cuando: formatoParaPaciente(t.fecha_hora_inicio),
        estado: t.estado,
        paciente: { id: t.paciente?.id, nombre: t.paciente?.nombre_completo, telefono: t.paciente?.telefono_whatsapp, email: t.paciente?.email },
        profesional: { id: t.profesional?.id, nombre: t.profesional?.nombre, especialidad: t.profesional?.especialidad },
      };
    });
  }

  /** n8n informa que envió el recordatorio. Idempotente por índice único. */
  async registrarRecordatorioEnviado(turnoId: string, mensajeExternoId?: string) {
    const turno = await db.query.turnos.findFirst({ where: (t, { eq }) => eq(t.id, turnoId) });
    if (!turno) throw new NotFoundError('Turno no encontrado');
    const registro = await new LogComunicacionRepository(db).registrar({
      turno_id: turnoId, clinica_id: turno.clinica_id, tipo: 'recordatorio',
      mensaje_externo_id: mensajeExternoId ?? null,
    });
    return { registrado: registro !== null, duplicado: registro === null };
  }

  async updateGoogleEventId(id: string, googleEventId: string) {
    return new TurnosRepository(db).updateWithoutClinica(id, { google_event_id: googleEventId });
  }

  // ─── Integración con n8n (calendario) ───────────────────────────────────

  private async notificarN8n(turno: { id: string; profesional_id: string; paciente_id: string; fecha_hora_inicio: string; estado: string; google_event_id: string | null }, accion: 'CREAR' | 'ACTUALIZAR' | 'CANCELAR', motivo: string) {
    try {
      const prof = await db.query.profesionales.findFirst({ where: (p, { eq }) => eq(p.id, turno.profesional_id) });
      const pac = await db.query.pacientes.findFirst({ where: (p, { eq }) => eq(p.id, turno.paciente_id) });
      const local = partesLocales(turno.fecha_hora_inicio);
      const eventId = await n8nService.notificar({
        accion,
        turno_id: turno.id,
        paciente: pac?.nombre_completo || 'Desconocido',
        fecha: local.fecha,          // hora local del consultorio (A-01)
        hora: local.hora,
        inicio_utc: new Date(normalizarAUtc(turno.fecha_hora_inicio)).toISOString(),
        estado: turno.estado,
        medico_email: prof?.google_calendar_id || null,
        google_event_id: turno.google_event_id,
        telefono: pac?.telefono_whatsapp || 'No especificado',
        paciente_email: pac?.email || null,
        cuando: formatoParaPaciente(turno.fecha_hora_inicio),
        motivo,
        profesional: {
          nombre: prof?.nombre || 'Profesional',
          especialidad: prof?.especialidad || 'Especialidad',
        },
        // Instante UTC: NO usarlo en textos al paciente; usar `cuando`, `fecha` y `hora`
        record: {
          fecha_hora_inicio: turno.fecha_hora_inicio,
        }
      });
      if (accion === 'CREAR' && eventId) {
        await this.repo.update(turno.id, { google_event_id: eventId });
      }
    } catch (e) {
      logger.error({ err: e, turno_id: turno.id }, 'Error al notificar a n8n');
    }
  }
}

export const turnosService = new TurnosService();
