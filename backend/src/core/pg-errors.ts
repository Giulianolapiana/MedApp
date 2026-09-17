import { ConflictError } from './errors.js';

/** Traduce violaciones de restricciones de PostgreSQL a errores de dominio (K-07). */
export function traducirErrorPg(e: unknown): never {
  // drizzle-orm ≥ 0.4x envuelve el error del driver en `cause`
  const err = e as { code?: string; cause?: { code?: string } };
  const code = err?.code ?? err?.cause?.code;
  if (code === '23P01' || code === '23505') {
    throw new ConflictError('El horario ya fue reservado. Elegí otro horario.');
  }
  if (code === '23514') {
    throw new ConflictError('La operación viola una regla de negocio del turno.');
  }
  throw e;
}
