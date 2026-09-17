#!/bin/sh
# Restaura un volcado en una base VACÍA (nunca sobre producción sin backup previo).
# Uso: DESTINO_URL=postgresql://... ./restaurar.sh /respaldos/medapp_YYYYMMDDTHHMMSSZ.dump
set -eu
# Las extensiones no se incluyen en un volcado de --schema=public: crearlas antes.
psql "$DESTINO_URL" -v ON_ERROR_STOP=1 \
  -c "DROP SCHEMA IF EXISTS public CASCADE;" \
  -c "CREATE SCHEMA IF NOT EXISTS extensions;" \
  -c "CREATE EXTENSION IF NOT EXISTS btree_gist SCHEMA extensions;"
pg_restore --exit-on-error --dbname "$DESTINO_URL" --no-owner --no-privileges "$1"
psql "$DESTINO_URL" -c "SELECT 'turnos' AS tabla, count(*) FROM turnos UNION ALL SELECT 'pacientes', count(*) FROM pacientes;"
