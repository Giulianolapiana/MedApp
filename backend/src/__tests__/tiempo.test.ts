import { describe, it, expect } from 'vitest';
import { normalizarAUtc, partesLocales, rangoDiaLocal, formatoParaPaciente } from '../core/tiempo.js';

describe('Zona horaria del consultorio (A-01)', () => {
  it('interpreta fecha sin offset como hora de Mendoza', () => {
    expect(normalizarAUtc('2026-08-26T13:30:00')).toBe('2026-08-26T16:30:00.000Z');
  });
  it('respeta fechas con offset explícito', () => {
    expect(normalizarAUtc('2026-08-26T13:30:00-03:00')).toBe('2026-08-26T16:30:00.000Z');
    expect(normalizarAUtc('2026-08-26T16:30:00Z')).toBe('2026-08-26T16:30:00.000Z');
    expect(normalizarAUtc('2026-08-26 16:30:00+00')).toBe('2026-08-26T16:30:00.000Z');
  });
  it('muestra al paciente la hora local, no la UTC', () => {
    expect(partesLocales('2026-08-26T16:30:00+00:00')).toEqual({ fecha: '2026-08-26', hora: '13:30' });
    expect(formatoParaPaciente('2026-08-26T16:30:00Z')).toContain('13:30 hs');
  });
  it('un turno a las 23:00 locales pertenece a ese día y no al siguiente', () => {
    expect(partesLocales('2026-08-27T02:00:00Z').fecha).toBe('2026-08-26');
    const r = rangoDiaLocal('2026-08-26');
    expect(r).toEqual({ inicio: '2026-08-26T03:00:00.000Z', fin: '2026-08-27T03:00:00.000Z' });
  });
  it('rechaza fechas inválidas', () => {
    expect(() => normalizarAUtc('mañana a las 10')).toThrow();
  });
});
