import { z } from 'zod';
import { config } from 'dotenv';

// Cargar variables de entorno desde .env
config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string().url("Debe ser una URL de conexión PostgreSQL válida"),
  SUPABASE_URL: z.string().url("Debe ser la URL de tu proyecto Supabase"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Service Role Key es obligatoria"),
  N8N_WEBHOOK_URL: z.string().url().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Error en las variables de entorno:', _env.error.format());
  process.exit(1);
}

export const ENV = _env.data;
