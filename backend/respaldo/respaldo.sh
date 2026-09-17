#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# MedApp · Respaldo de recuperación de la base de datos (A-07, §4.6)
#
# 1. Ejecuta pg_dump (formato custom, comprimido) contra la base de Supabase.
# 2. Verifica que el archivo sea legible por pg_restore.
# 3. Aplica la retención (borra volcados de más de RETENCION_DIAS).
# 4. Registra el resultado en MedApp (tabla backups_auditoria) vía API.
#
# Variables requeridas:
#   DATABASE_URL    conexión DIRECTA o pooler en modo sesión (puerto 5432, no 6543)
#   MEDAPP_API_URL  p. ej. https://api.verticedev.online
#   N8N_API_KEY     misma clave que usa el backend
# Opcionales: RESPALDO_DIR (/respaldos), RETENCION_DIAS (14)
# ─────────────────────────────────────────────────────────────────────────────
set -u

DIR="${RESPALDO_DIR:-/respaldos}"
RET="${RETENCION_DIAS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVO="$DIR/medapp_$STAMP.dump"
mkdir -p "$DIR"

ESTADO="fallido"; TAMANO=0; DETALLE=""

if pg_dump "$DATABASE_URL" --format=custom --compress=6 --no-owner --no-privileges \
      --schema=public --file "$ARCHIVO" 2>/tmp/pg_dump.err; then
  if pg_restore --list "$ARCHIVO" >/tmp/pg_list.txt 2>>/tmp/pg_dump.err; then
    ESTADO="completado"
    TAMANO="$(stat -c %s "$ARCHIVO")"
    OBJETOS="$(grep -c 'TABLE DATA' /tmp/pg_list.txt || true)"
    DETALLE="pg_dump OK; ${OBJETOS} tablas con datos; verificado con pg_restore --list"
  else
    DETALLE="Volcado ilegible: $(tail -c 300 /tmp/pg_dump.err | tr '\n\r\t"\\' '     ')"
  fi
else
  DETALLE="pg_dump falló: $(tail -c 300 /tmp/pg_dump.err | tr '\n\r\t"\\' '     ')"
  rm -f "$ARCHIVO"
fi

find "$DIR" -name 'medapp_*.dump' -mtime +"$RET" -delete

curl -fsS -m 20 -X POST "$MEDAPP_API_URL/api/v1/backups/registro" \
  -H "x-api-key: $N8N_API_KEY" -H "Content-Type: application/json" \
  -d "{\"tipo_artefacto\":\"respaldo_bd\",\"tipo_ejecucion\":\"${TIPO_EJECUCION:-automatica}\",\"estado\":\"$ESTADO\",\"archivo_ruta\":\"$ARCHIVO\",\"tamano_bytes\":$TAMANO,\"detalle\":\"$DETALLE\"}" \
  || echo "ADVERTENCIA: no se pudo registrar el respaldo en la API"

echo "[$STAMP] $ESTADO · $TAMANO bytes · $DETALLE"
[ "$ESTADO" = "completado" ]
