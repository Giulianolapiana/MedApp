#!/usr/bin/env bash
# Crea una base de prueba a partir del esquema de PRODUCCIÓN versionado (A2-06).
# Uso: DATABASE_URL=postgresql://.../medapp_test bash sql/pruebas/cargar_esquema.sh
set -euo pipefail
cd "$(dirname "$0")/.."
ESQ=esquema.sql
if [ ! -s "$ESQ" ]; then
  echo "ERROR: backend/sql/esquema.sql está vacío. Regenerarlo con pg_dump --schema-only." >&2
  exit 1
fi
grep -q "turnos_sin_solapamiento_excl" "$ESQ" || { echo "ERROR: el esquema no contiene la restricción de exclusión." >&2; exit 1; }
if grep -q "on_turno_change" "$ESQ"; then
  echo "ERROR: el esquema todavía contiene el disparador on_turno_change (K2-02)." >&2; exit 1
fi
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f pruebas/stubs_supabase.sql
# Adaptaciones del volcado de pg_dump 17 a un psql estándar
sed -e '/^\\restrict/d' -e '/^\\unrestrict/d' -e '/transaction_timeout/d' \
    -e "s/set_config('search_path', '', false)/set_config('search_path', 'public, extensions', false)/" \
    -e 's/^CREATE SCHEMA public;/-- public ya existe/' "$ESQ" \
  | psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f 2026-09-24_ronda4_entrega.sql
echo "Base de prueba creada desde el esquema de producción."
