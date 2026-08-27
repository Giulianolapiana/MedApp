import { db } from '../../core/database.js';
import { NotFoundError, ConflictError, ValidationError } from '../../core/errors.js';
import { TurnosRepository, HistorialTurnosRepository } from './turnos.repository.js';
import { PacientesRepository } from '../pacientes/pacientes.repository.js';
import { validarTransicion, getTransicionesPosibles, EstadoTurno } from './turnos.fsm.js';
import { CrearTurnoType, AvanzarEstadoType } from './turnos.schemas.js';

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

  async obtener(id: string, clinicaId: string) {
    const turno = await this.repo.getById(id, clinicaId);
    if (!turno) throw new NotFoundError('Turno no encontrado');
    return turno;
  }

  async contar(clinicaId: string, filters: { fecha?: string; fecha_desde?: string; fecha_hasta?: string; profesionalId?: string; estado?: string }) {
    // Para simplificar, listamos y contamos, o mejor agregar count al repo
    // Como Drizzle no tiene una forma trivial de hacer count() dinámico tan fácil como list,
    // podemos reusar listByClinica con paginación infinita o implementar count.
    // Lo más eficiente: implementarlo en repo, pero si hay pocos turnos, podemos delegarlo.
    // Vamos a agregar countByClinica en el repo.
    return this.repo.countByClinica(clinicaId, filters);
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
    return await db.transaction(async (tx) => {
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
    // POST-COMMIT: acá iría la notificación a n8n (fuera del UoW)
  }

  /**
   * Avanza el estado del turno usando la FSM.
   * Usa transacción atómica para actualizar estado + registrar historial.
   *
   * RN-03: Motivo obligatorio si nuevo_estado = 'cancelado'.
   * RN-04: Notificaciones post-commit (fuera del bloque UoW).
   */
  async avanzarEstado(id: string, data: AvanzarEstadoType, userId: string, clinicaId: string) {
    // RN-03: Motivo obligatorio para cancelación
    if (data.nuevo_estado === 'cancelado' && !data.motivo) {
      throw new ValidationError('El motivo es obligatorio al cancelar un turno');
    }

    return await db.transaction(async (tx) => {
      const turnosRepoTx = new TurnosRepository(tx);
      const historialRepoTx = new HistorialTurnosRepository(tx);

      // 1. Obtener turno y verificar que pertenece a la clínica
      const turno = await turnosRepoTx.getById(id, clinicaId);
      if (!turno) throw new NotFoundError('Turno no encontrado');

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
    // POST-COMMIT: notificación a n8n (futuro)
    // await notificacionesService.enviar({ turno_id: turnoId, tipo: data.nuevo_estado });
  }
}

function getTransicionesPosiblesStr(estado: EstadoTurno): string {
  return getTransicionesPosibles(estado).join(', ') || 'ninguna (estado terminal)';
}

export const turnosService = new TurnosService();
