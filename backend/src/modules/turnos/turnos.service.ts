import { db } from '../../core/database.js';
import { NotFoundError, ConflictError, ValidationError } from '../../core/errors.js';
import { TurnosRepository, HistorialTurnosRepository } from './turnos.repository.js';
import { PacientesRepository } from '../pacientes/pacientes.repository.js';
import { validarTransicion, getTransicionesPosibles, EstadoTurno } from './turnos.fsm.js';
import { CrearTurnoType, AvanzarEstadoType } from './turnos.schemas.js';
import { n8nService } from './n8n.service.js';
import { logger } from '../../core/logger.js';

export class TurnosService {
  private repo = new TurnosRepository(db);
  private historialRepo = new HistorialTurnosRepository(db);

  async listar(
    clinicaId: string,
    filters: { fecha?: string; fecha_desde?: string; fecha_hasta?: string; profesionalId?: string; estado?: string },
    page = 1,
    size = 100
  ) {
    const skip = (page - 1) * size;
    return this.repo.listByClinica(clinicaId, filters, skip, size);
  }

  async obtener(id: string, clinicaId: string, profesionalId?: string) {
    const turno = await this.repo.getById(id, clinicaId);
    if (!turno) throw new NotFoundError('Turno no encontrado');
    if (profesionalId && turno.profesional_id !== profesionalId) {
      throw new ConflictError('No tienes permiso para ver este turno');
    }
    return turno;
  }

  async contar(clinicaId: string, filters: { fecha?: string; fecha_desde?: string; fecha_hasta?: string; profesionalId?: string; estado?: string }) {
    return this.repo.countByClinica(clinicaId, filters);
  }

  async getStats(clinicaId: string, fecha_desde?: string, fecha_hasta?: string) {
    const filters = { fecha_desde, fecha_hasta };
    
    const [
      total, pendientes, confirmado, cancelado, asistido, no_show
    ] = await Promise.all([
      this.repo.countByClinica(clinicaId, filters),
      this.repo.countByClinica(clinicaId, { ...filters, estado: 'pendiente' }),
      this.repo.countByClinica(clinicaId, { ...filters, estado: 'confirmado' }),
      this.repo.countByClinica(clinicaId, { ...filters, estado: 'cancelado' }),
      this.repo.countByClinica(clinicaId, { ...filters, estado: 'asistido' }),
      this.repo.countByClinica(clinicaId, { ...filters, estado: 'no_show' })
    ]);

    const tasaAsistencia = total > 0 ? Math.round((asistido / total) * 100) : 0;
    const tasaCancelacion = total > 0 ? Math.round((cancelado / total) * 100) : 0;

    return {
      total, pendientes, confirmado, cancelado, asistido, no_show,
      tasaAsistencia, tasaCancelacion
    };
  }

  async obtenerHistorial(turnoId: string) {
    return this.historialRepo.listByTurno(turnoId);
  }

  /**
   * Crea un turno usando UoW (transacción atómica).
   * 1. Busca o crea el paciente
   * 2. Verifica que no haya conflicto de horario
   * 3. Crea el turno
   * 4. Registra en el historial (append-only)
   */
  async crear(data: CrearTurnoType, clinicaId: string) {
    const result = await db.transaction(async (tx) => {
      const turnosRepoTx = new TurnosRepository(tx);
      const pacientesRepoTx = new PacientesRepository(tx);
      const historialRepoTx = new HistorialTurnosRepository(tx);

      // 1. Buscar o crear paciente
      const existente = await pacientesRepoTx.findByTelefono(clinicaId, data.paciente.telefono_whatsapp);
      let pacienteId: string;

      if (existente) {
        pacienteId = existente.id;
        // Si el paciente ingresó un email distinto (o ahora lo completó), lo actualizamos
        if (data.paciente.email && existente.email !== data.paciente.email) {
          await pacientesRepoTx.update(pacienteId, {
            email: data.paciente.email,
            nombre_completo: data.paciente.nombre_completo
          });
        }
      } else {
        const nuevo = await pacientesRepoTx.create({
          nombre_completo: data.paciente.nombre_completo,
          telefono_whatsapp: data.paciente.telefono_whatsapp,
          email: data.paciente.email ?? null,
          clinica_id: clinicaId,
        });
        pacienteId = nuevo.id;
      }

      // 2. Verificar conflicto de horario
      const conflicto = await turnosRepoTx.findConflicto(data.profesional_id, data.fecha_hora_inicio);
      if (conflicto) {
        throw new ConflictError('Ya existe un turno en ese horario para este profesional');
      }

      // 3. Crear turno
      const turno = await turnosRepoTx.create({
        paciente_id: pacienteId,
        profesional_id: data.profesional_id,
        clinica_id: clinicaId,
        fecha_hora_inicio: data.fecha_hora_inicio,
        canal_reserva: data.canal_reserva,
      });

      // 4. Registrar en historial (append-only)
      await historialRepoTx.registrar({
        turno_id: turno.id,
        estado_desde: 'nuevo',
        estado_hacia: 'pendiente',
      });

      return turno;
    });

    // POST-COMMIT: notificar a n8n
    try {
      const prof = await db.query.profesionales.findFirst({
        where: (p, { eq }) => eq(p.id, result.profesional_id)
      });
      const pac = await db.query.pacientes.findFirst({
        where: (p, { eq }) => eq(p.id, result.paciente_id)
      });
      
      const d = new Date(result.fecha_hora_inicio);
      const fecha = d.toISOString().split('T')[0];
      const hora = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;

      const eventId = await n8nService.notificar({
        accion: 'CREAR',
        paciente: pac?.nombre_completo || 'Desconocido',
        fecha,
        hora,
        estado: result.estado,
        medico_email: prof?.google_calendar_id || null,
        google_event_id: null,
        telefono: pac?.telefono_whatsapp || 'No especificado',
        motivo: 'Reserva web (nuevo turno)'
      });

      if (eventId) {
        // En lugar de importar 'eq' y 'turnos', delegamos la actualización a TurnosRepository
        await this.repo.update(result.id, { google_event_id: eventId });
        result.google_event_id = eventId;
      }
    } catch (e) {
      logger.error({ err: e, turno_id: result.id }, "Error al notificar n8n en creación de turno");
    }

    return result;
  }

  /**
   * Avanza el estado del turno usando la FSM.
   * Usa transacción atómica para actualizar estado + registrar historial.
   *
   * RN-03: Motivo obligatorio si nuevo_estado = 'cancelado'.
   * RN-04: Notificaciones post-commit (fuera del bloque UoW).
   */
  async avanzarEstado(id: string, data: AvanzarEstadoType, userId: string, clinicaId: string, userRol?: string, profesionalId?: string) {
    // RN-03: Motivo obligatorio para cancelación
    if (data.nuevo_estado === 'cancelado' && !data.motivo) {
      throw new ValidationError('El motivo es obligatorio al cancelar un turno');
    }

    // Se removió la restricción para que los PROFESIONALES puedan gestionar todos los estados.
    const result = await db.transaction(async (tx) => {
      const turnosRepoTx = new TurnosRepository(tx);
      const historialRepoTx = new HistorialTurnosRepository(tx);

      // 1. Obtener turno y verificar que pertenece a la clínica
      const turno = await turnosRepoTx.getById(id, clinicaId);
      if (!turno) throw new NotFoundError('Turno no encontrado');

      if (profesionalId && turno.profesional_id !== profesionalId) {
        throw new ConflictError('No tienes permiso para modificar este turno');
      }

      const estadoActual = turno.estado as EstadoTurno;
      const nuevoEstado = data.nuevo_estado as EstadoTurno;

      // Validar transición FSM
      if (!validarTransicion(estadoActual, nuevoEstado)) {
        throw new ConflictError(
          `Transición inválida: ${estadoActual} → ${nuevoEstado}. ` +
          `Transiciones permitidas desde '${estadoActual}': ${getTransicionesPosiblesStr(estadoActual)}`
        );
      }

      // Actualizar estado
      const turnoActualizado = await turnosRepoTx.update(id, {
        estado: nuevoEstado,
      }, clinicaId);

      // Registrar en historial (append-only)
      await historialRepoTx.registrar({
        turno_id: id,
        estado_desde: estadoActual,
        estado_hacia: nuevoEstado,
        usuario_id: userId ?? null,
        motivo: data.motivo ?? null,
      });

      return turnoActualizado;
    });

    // POST-COMMIT: notificación a n8n
    try {
      const prof = await db.query.profesionales.findFirst({
        where: (p, { eq }) => eq(p.id, result.profesional_id)
      });
      const pac = await db.query.pacientes.findFirst({
        where: (p, { eq }) => eq(p.id, result.paciente_id)
      });
      
      const accionN8n = result.estado === 'cancelado' ? 'CANCELAR' : 'ACTUALIZAR';
      
      const d = new Date(result.fecha_hora_inicio);
      const fecha = d.toISOString().split('T')[0];
      const hora = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;

      await n8nService.notificar({
        accion: accionN8n,
        paciente: pac?.nombre_completo || 'Desconocido',
        fecha,
        hora,
        estado: result.estado,
        medico_email: prof?.google_calendar_id || null,
        google_event_id: result.google_event_id,
        telefono: pac?.telefono_whatsapp || 'No especificado',
        motivo: data.motivo || 'Sin motivo especificado'
      });
    } catch (e) {
      logger.error({ err: e, turno_id: result.id }, "Error al notificar n8n en actualización de turno");
    }

    return result;
  }

  /**
   * Actualiza el google_event_id enviado por n8n
   */
  async updateGoogleEventId(id: string, googleEventId: string) {
    // Aquí no tenemos la clinicaId fácilmente en el webhook (depende de cómo configuremos n8n),
    // pero id es UUID primary key así que es seguro actualizarlo.
    const turnosRepo = new TurnosRepository(db);
    return await turnosRepo.updateWithoutClinica(id, { google_event_id: googleEventId });
  }

  /**
   * Obtiene los turnos para recordatorio automático (usado por n8n)
   */
  async obtenerTurnosParaRecordatorio(fecha?: string) {
    let fechaObjetivo = fecha;
    if (!fechaObjetivo) {
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      fechaObjetivo = `${manana.getFullYear()}-${String(manana.getMonth() + 1).padStart(2, '0')}-${String(manana.getDate()).padStart(2, '0')}`;
    }

    const turnosRepo = new TurnosRepository(db);
    return await turnosRepo.obtenerTurnosParaRecordatorio(fechaObjetivo);
  }
}

function getTransicionesPosiblesStr(estado: EstadoTurno): string {
  return getTransicionesPosibles(estado).join(', ') || 'ninguna (estado terminal)';
}

export const turnosService = new TurnosService();
