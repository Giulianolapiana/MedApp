import { DrizzleClient, DrizzleTransaction, db } from './database.js';

// Importaremos los repositorios a medida que los vayamos creando
// import { TurnosRepository } from '../modules/turnos/turnos.repository.js';

export class UnitOfWork {
  // readonly turnos: TurnosRepository;

  constructor(private tx: DrizzleTransaction) {
    // this.turnos = new TurnosRepository(tx);
  }
}

/**
 * Ejecuta una función dentro de una transacción de base de datos.
 * Garantiza atomicidad: si la función lanza error, se hace ROLLBACK automático.
 * Si termina con éxito, se hace COMMIT automático.
 */
export async function withUoW<T>(
  callback: (uow: UnitOfWork) => Promise<T>,
  drizzleClient: DrizzleClient = db
): Promise<T> {
  return drizzleClient.transaction(async (tx) => {
    const uow = new UnitOfWork(tx);
    return callback(uow);
  });
}
