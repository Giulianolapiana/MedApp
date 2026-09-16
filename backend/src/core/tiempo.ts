/**
 * Utilidades de fecha y hora (hallazgo A-01 del tribunal).
 *
 * Convención única del sistema:
 *  - En la base de datos todo instante se guarda como timestamptz (UTC real).
 *  - Toda fecha/hora que se muestra al paciente o al personal se formatea en la
 *    zona del consultorio (America/Argentina/Mendoza).
 *  - Una fecha/hora recibida SIN offset (ej. "2026-09-15T10:00:00", como la envía
 *    el agente conversacional) se interpreta como hora local del consultorio.
 */
export const ZONA_CONSULTORIO = 'America/Argentina/Mendoza';

const TIENE_OFFSET = /(Z|[+-]\d{2}(:?\d{2})?)$/i;

/** Offset (en minutos) de la zona del consultorio para un instante dado. */
function offsetMinutos(instante: Date, zona = ZONA_CONSULTORIO): number {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: zona, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(instante);
  const v = (t: string) => Number(partes.find(p => p.type === t)!.value);
  const comoUTC = Date.UTC(v('year'), v('month') - 1, v('day'), v('hour'), v('minute'), v('second'));
  return Math.round((comoUTC - instante.getTime()) / 60000);
}

/** Convierte una fecha/hora de entrada a ISO UTC. Lanza si es inválida. */
export function normalizarAUtc(entrada: string, zona = ZONA_CONSULTORIO): string {
  const limpio = entrada.trim().replace(' ', 'T');
  if (TIENE_OFFSET.test(limpio)) {
    // Postgres devuelve offsets cortos ("+00"); Date necesita "+00:00".
    const d = new Date(limpio.replace(/([+-]\d{2})$/, '$1:00'));
    if (Number.isNaN(d.getTime())) throw new Error(`Fecha inválida: ${entrada}`);
    return d.toISOString();
  }
  const m = limpio.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) throw new Error(`Fecha inválida: ${entrada}`);
  const [, y, mo, d, h, mi, s] = m;
  const comoUTC = Date.UTC(+y, +mo - 1, +d, +h, +mi, +(s ?? 0));
  // Dos pasadas para cubrir cambios de horario (Argentina hoy no los tiene).
  let utc = comoUTC - offsetMinutos(new Date(comoUTC), zona) * 60000;
  utc = comoUTC - offsetMinutos(new Date(utc), zona) * 60000;
  return new Date(utc).toISOString();
}

/** Fecha (YYYY-MM-DD) y hora (HH:mm) locales del consultorio para un instante. */
export function partesLocales(instante: string | Date, zona = ZONA_CONSULTORIO) {
  const d = typeof instante === 'string' ? new Date(normalizarAUtc(instante, zona)) : instante;
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(d);
  const v = (t: string) => f.find(p => p.type === t)!.value;
  return { fecha: `${v('year')}-${v('month')}-${v('day')}`, hora: `${v('hour')}:${v('minute')}` };
}

/** Texto legible para mensajes al paciente: "martes 15/09/2026 a las 10:00 hs". */
export function formatoParaPaciente(instante: string | Date, zona = ZONA_CONSULTORIO): string {
  const d = typeof instante === 'string' ? new Date(normalizarAUtc(instante, zona)) : instante;
  const dia = new Intl.DateTimeFormat('es-AR', { timeZone: zona, weekday: 'long' }).format(d);
  const fecha = new Intl.DateTimeFormat('es-AR', { timeZone: zona, day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  return `${dia} ${fecha} a las ${partesLocales(d, zona).hora} hs`;
}

/** Límites UTC [inicio, fin) de un día local del consultorio. */
export function rangoDiaLocal(fecha: string, zona = ZONA_CONSULTORIO) {
  const inicio = normalizarAUtc(`${fecha}T00:00:00`, zona);
  const fin = new Date(new Date(inicio).getTime() + 24 * 3600 * 1000).toISOString();
  return { inicio, fin };
}

/** Fecha local (YYYY-MM-DD) de mañana en la zona del consultorio. */
export function fechaLocalManana(ahora = new Date(), zona = ZONA_CONSULTORIO): string {
  return partesLocales(new Date(ahora.getTime() + 24 * 3600 * 1000), zona).fecha;
}

/** Duración estándar de un turno (min). Única fuente para slots y fecha_hora_fin. */
export const DURACION_TURNO_MINUTOS = 30;

export function sumarMinutos(isoUtc: string, minutos: number): string {
  return new Date(new Date(isoUtc).getTime() + minutos * 60000).toISOString();
}
