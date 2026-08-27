import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { ENV } from './config.js';
import * as schema from '../db/schema.js';

// Usamos el DATABASE_URL que debería ser el URI de conexión directa de Supabase
// (ej: postgresql://postgres.[project-ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres)
const queryClient = postgres(ENV.DATABASE_URL);

// Instancia de la DB usando Drizzle ORM
export const db = drizzle(queryClient, { schema });

// Exportar tipos inferidos si se necesitan
export type DrizzleClient = typeof db;
export type DrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
