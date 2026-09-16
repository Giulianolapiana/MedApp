import { db } from '../../core/database.js';
import { eq, and, gte, lt, inArray } from 'drizzle-orm';
import { rangoDiaLocal, partesLocales, DURACION_TURNO_MINUTOS } from '../../core/tiempo.js';
import { NotFoundError, ValidationError } from '../../core/errors.js';
import { DisponibilidadRepository } from './disponibilidad.repository.js';
import { turnos } from '../../db/schema.js';
import { GuardarDisponibilidadType } from './disponibilidad.schemas.js';


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

    // Turnos activos de ese día local del consultorio (A-01: rango UTC calculado en Mendoza)
    const { inicio, fin } = rangoDiaLocal(fecha);
    const turnosOcupados = await db
      .select()
      .from(turnos)
      .where(
        and(
          eq(turnos.profesional_id, profesionalId),
          eq(turnos.clinica_id, clinicaId),
          inArray(turnos.estado, ['pendiente', 'confirmado']),
          gte(turnos.fecha_hora_inicio, inicio),
          lt(turnos.fecha_hora_inicio, fin)
        )
      );

    const horasOcupadas = new Set(turnosOcupados.map(t => partesLocales(t.fecha_hora_inicio).hora));

    // "Hoy" y "ahora" en la zona del consultorio, no en la del servidor
    const ahoraLocal = partesLocales(new Date());
    const esHoy = fecha === ahoraLocal.fecha;
    const [hA, mA] = ahoraLocal.hora.split(':').map(Number);
    const minutosActuales = hA * 60 + mA;

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
