import { db } from '../../core/database.js';
import { eq, and, gte, lt, inArray } from 'drizzle-orm';
import { rangoDiaLocal, partesLocales, DURACION_TURNO_MINUTOS } from '../../core/tiempo.js';

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
    // Un profesional inexistente, dado de baja o de otra clínica no ofrece horarios (A3-01)
    const prof = await db.query.profesionales.findFirst({ where: (p, { eq: igual }) => igual(p.id, profesionalId) });
    if (!prof || !prof.activo || prof.clinica_id !== clinicaId) return [];

    // Día de la semana de la fecha calendario (sin depender de la zona del servidor)
    const [year, month, day] = fecha.split('-').map(Number);
    const diaSemana = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0=Domingo, 1=Lunes, ...

    // Todas las franjas habilitadas del profesional para ese día
    const franjas = await this.repo.getByProfesionalAndDia(profesionalId, diaSemana, clinicaId);
    if (franjas.length === 0) return []; // El profesional no atiende ese día

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
    const aMin = (h: string) => { const [hh, mm] = h.split(':').map(Number); return hh * 60 + mm; };

    // Grilla de DURACION_TURNO_MINUTOS dentro de cada franja; un turno debe terminar dentro de ella
    const vistos = new Set<string>();
    const slots: { hora: string; disponible: boolean }[] = [];
    for (const franja of [...franjas].sort((a, b) => aMin(a.horario_inicio) - aMin(b.horario_inicio))) {
      const finMin = aMin(franja.horario_fin);
      for (let m = aMin(franja.horario_inicio); m + DURACION_TURNO_MINUTOS <= finMin; m += DURACION_TURNO_MINUTOS) {
        if (esHoy && m <= minutosActuales) continue; // los horarios de hoy que ya pasaron no se ofrecen
        const hora = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
        if (vistos.has(hora)) continue;
        vistos.add(hora);
        slots.push({ hora, disponible: !horasOcupadas.has(hora) });
      }
    }
    return slots;
  }

  /**
   * Devuelve los días de la semana (0-6) en que el profesional tiene disponibilidad habilitada.
   */
  async diasDisponibles(profesionalId: string, clinicaId: string): Promise<number[]> {
    const prof = await db.query.profesionales.findFirst({ where: (p, { eq: igual }) => igual(p.id, profesionalId) });
    if (!prof || !prof.activo || prof.clinica_id !== clinicaId) return [];
    const configs = await this.repo.listByProfesional(profesionalId);
    return [...new Set(configs
      .filter(c => c.habilitado && c.clinica_id === clinicaId)
      .map(c => c.dia_semana))];
  }
}

export const disponibilidadService = new DisponibilidadService();
