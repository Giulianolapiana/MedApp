// Aplica un script SQL versionado contra la base definida en backend/.env
// Uso (desde la carpeta backend):  node scripts/aplicar_sql.mjs sql/2026-09-18_ronda3_endurecimiento.sql
import postgres from 'postgres';
import fs from 'node:fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
const archivo = process.argv[2];
if (!archivo) {
  console.error('Indicá el archivo: node scripts/aplicar_sql.mjs sql/<archivo>.sql');
  process.exit(1);
}
if (/:6543\//.test(process.env.DATABASE_URL ?? '')) {
  console.warn('Aviso: el pooler en modo transacción (6543) puede fallar con scripts largos; si falla, usá el puerto 5432.');
}
const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
try {
  const rawSql = fs.readFileSync(archivo, 'utf8');
  const safeSql = rawSql.replace(/BEGIN;/gi, '').replace(/COMMIT;/gi, '');
  await sql.unsafe(safeSql);
  console.log(`OK: ${archivo} aplicado.`);
} catch (e) {
  console.error(`ERROR en ${archivo}:`, e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
