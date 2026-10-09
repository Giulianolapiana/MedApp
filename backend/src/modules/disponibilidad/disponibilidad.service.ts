import { db } from '../../core/database.js';
import { eq, and, gte, lt, inArray } from 'drizzle-orm';
import { rangoDiaLocal, partesLocales, DURACION_TURNO_MINUTOS } from '../../core/tiempo.js';

import { DisponibilidadRepository } from './disponibilidad.repository.js';
import { turnos } from '../../db/schema.js';
import { GuardarDisponibilidadType } from './disponibilidad.schemas.js';
import { ValidationError, NotFoundError } from '../../core/errors.js';

const NOMBRES_DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const NOMBRES_DIA_SIN_TILDE = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];


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
   * Próximas fechas con horarios libres de un profesional (herramienta del asistente).
   * El backend calcula fecha, día de la semana y horarios: el modelo de lenguaje no
   * tiene que deducir qué día cae cada fecha (error observado el 07/10: "viernes 14").
   * - desde: fecha local inicial; nunca anterior a hoy en Mendoza (por defecto, hoy).
   * - dias: ventana de búsqueda, entre 1 y 31 (por defecto 21).
   * - dia: filtra un día de la semana ("viernes", "el próximo viernes" o 5).
   * - Un profesional inexistente, dado de baja o de otra clínica responde 404: una lista
   *   vacía haría que el asistente informe "no hay horarios" (evaluación del 09/10).
   * Solo devuelve fechas con al menos un horario disponible.
   */
  async proximosHorarios(profesionalId: string, clinicaId: string, opciones: { desde?: string; dias?: number; dia?: string } = {}) {
    const prof = await db.query.profesionales.findFirst({ where: (p, { eq: igual }) => igual(p.id, profesionalId) });
    if (!prof || !prof.activo || prof.clinica_id !== clinicaId) throw new NotFoundError('Profesional no encontrado en esta clínica');
    const hoy = partesLocales(new Date()).fecha;
    if (opciones.desde !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(opciones.desde)) throw new ValidationError('desde debe tener formato YYYY-MM-DD');
    // PI-22: no se ofrecen fechas pasadas; las fechas ISO se comparan como texto
    const desde = opciones.desde && opciones.desde > hoy ? opciones.desde : hoy;
    const dias = Math.min(Math.max(Math.trunc(opciones.dias ?? 21) || 21, 1), 31);
    let filtroDia: number | undefined;
    if (opciones.dia !== undefined && opciones.dia !== '') {
      const norm = opciones.dia.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      filtroDia = /^[0-6]$/.test(norm)
        ? Number(norm)
        : NOMBRES_DIA_SIN_TILDE.findIndex(d => norm === d || norm.includes(d));
      if (filtroDia < 0) throw new ValidationError('dia debe ser un día de la semana (lunes…domingo) o un número de 0 a 6');
    }
    const [y, m, d] = desde.split('-').map(Number);
    const resultado: { fecha: string; dia_semana: string; fecha_legible: string; horarios: string[] }[] = [];
    for (let i = 0; i < dias; i++) {
      const f = new Date(Date.UTC(y, m - 1, d + i));
      const diaSemana = f.getUTCDay();
      if (filtroDia !== undefined && diaSemana !== filtroDia) continue;
      const fecha = f.toISOString().slice(0, 10);
      const libres = (await this.generarSlots(profesionalId, clinicaId, fecha)).filter((s) => s.disponible).map((s) => s.hora);
      if (libres.length === 0) continue;
      const [yy, mm, dd] = fecha.split('-');
      resultado.push({ fecha, dia_semana: NOMBRES_DIA[diaSemana], fecha_legible: `${NOMBRES_DIA[diaSemana]} ${dd}/${mm}/${yy}`, horarios: libres });
    }
    return resultado;
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
