import { db } from '../../core/database.js';
import { eq, and } from 'drizzle-orm';
import { NotFoundError, ValidationError } from '../../core/errors.js';
import { DisponibilidadRepository } from './disponibilidad.repository.js';
import { turnos } from '../../db/schema.js';
import { GuardarDisponibilidadType } from './disponibilidad.schemas.js';

const DURACION_TURNO_MINUTOS = 30;

export class DisponibilidadService {
  private repo = new DisponibilidadRepository(db);

  /**
   * Obtiene la configuración semanal de disponibilidad de un profesional.
   */
  async obtenerConfiguracion(profesionalId: string) {
    return this.repo.listByProfesional(profesionalId);
  }

  /**
   * Guarda la configuración semanal completa (delete + insert).
   * Se usa upsert por profesional: borra todo lo anterior y re-inserta.
   */
  async guardarConfiguracion(profesionalId: string, clinicaId: string, data: GuardarDisponibilidadType) {
    // Transacción: borrar todo lo viejo y re-insertar
    return await db.transaction(async (tx) => {
      const repoTx = new DisponibilidadRepository(tx);
      await repoTx.deleteByProfesionalAndClinica(profesionalId, clinicaId);

      const inserts = data.items.map(item => ({
        profesional_id: profesionalId,
        clinica_id: clinicaId,
        dia_semana: item.dia_semana,
        horario_inicio: item.horario_inicio,
        horario_fin: item.horario_fin,
        habilitado: item.habilitado,
      }));

      const results = [];
      for (const insert of inserts) {
        const result = await repoTx.create(insert);
        results.push(result);
      }

      return results;
    });
  }

  /**
   * Genera los slots disponibles para un profesional en una fecha específica.
   * Esta lógica ESTABA en el frontend, ahora vive en el backend donde corresponde.
   */
  async generarSlots(profesionalId: string, clinicaId: string, fecha: string) {
    // Fix: Si fecha es "YYYY-MM-DD", new Date(fecha) asume UTC, 
    // y getDay() al usar hora local puede dar el día anterior en zonas como UTC-3.
    const [year, month, day] = fecha.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const diaSemana = date.getDay(); // 0=Domingo, 1=Lunes, ...

    // Buscar la disponibilidad del profesional para ese día
    const disponibilidadDia = await this.repo.getByProfesionalAndDia(
      profesionalId,
      diaSemana,
      clinicaId
    );

    if (disponibilidadDia.length === 0) {
      return []; // El profesional no atiende ese día
    }

    const config = disponibilidadDia[0];

    // Buscar turnos ya reservados para esa fecha
    const turnosDelDia = await db
      .select()
      .from(turnos)
      .where(
        and(
          eq(turnos.profesional_id, profesionalId),
          eq(turnos.clinica_id, clinicaId)
        )
      );

    // Filtrar solo los del día solicitado y que no estén cancelados
    const turnosOcupados = turnosDelDia.filter(t => {
      // Puede venir como "2026-09-03T..." o "2026-09-03 10:00:00+00"
      const turnoFecha = t.fecha_hora_inicio.substring(0, 10);
      return turnoFecha === fecha && t.estado !== 'cancelado';
    });

    const horasOcupadas = new Set(
      turnosOcupados.map(t => {
        const d = new Date(t.fecha_hora_inicio);
        return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
      })
    );

    // Determinar si la fecha solicitada es hoy para filtrar slots pasados
    const ahora = new Date();
    const esHoy = fecha === `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();

    // Generar los slots de DURACION_TURNO_MINUTOS minutos
    const slots: { hora: string; disponible: boolean }[] = [];
    const [inicioH, inicioM] = config.horario_inicio.split(':').map(Number);
    const [finH, finM] = config.horario_fin.split(':').map(Number);

    let currentMin = inicioH * 60 + inicioM;
    const endMin = finH * 60 + finM;

    while (currentMin < endMin) {
      const h = String(Math.floor(currentMin / 60)).padStart(2, '0');
      const m = String(currentMin % 60).padStart(2, '0');
      const hora = `${h}:${m}`;

      // Si es hoy, omitir completamente los horarios que ya pasaron
      if (esHoy && currentMin <= minutosActuales) {
        currentMin += DURACION_TURNO_MINUTOS;
        continue;
      }

      slots.push({
        hora,
        disponible: !horasOcupadas.has(hora),
      });

      currentMin += DURACION_TURNO_MINUTOS;
    }

    return slots;
  }

  /**
   * Devuelve los días de la semana (0-6) en que el profesional tiene disponibilidad habilitada.
   */
  async diasDisponibles(profesionalId: string, clinicaId: string): Promise<number[]> {
    const configs = await this.repo.listByProfesional(profesionalId);
    return configs
      .filter(c => c.habilitado && c.clinica_id === clinicaId)
      .map(c => c.dia_semana);
  }
}

export const disponibilidadService = new DisponibilidadService();
