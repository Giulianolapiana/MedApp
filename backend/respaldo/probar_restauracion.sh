#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# MedApp · Prueba de restauración del último respaldo (A-07)
#
# Levanta un PostgreSQL temporal DENTRO del contenedor de respaldo (la imagen
# postgres:17 ya trae el servidor), crea los objetos mínimos de Supabase que el
# volcado de --schema=public necesita (auth.uid(), auth.users, roles,
# btree_gist), restaura el volcado y comprueba datos, restricción de exclusión
# y disparadores. No toca la base de producción. Al terminar, borra la base temporal.
#
# Uso (consola del contenedor):  probar_restauracion.sh [archivo.dump]
#   Sin argumento usa el volcado más reciente de $RESPALDO_DIR (/respaldos).
# ─────────────────────────────────────────────────────────────────────────────
set -eu
DIR="${RESPALDO_DIR:-/respaldos}"
DUMP="${1:-$(ls -1t "$DIR"/medapp_*.dump | head -1)}"
[ -s "$DUMP" ] || { echo "No hay volcado para restaurar en $DIR" >&2; exit 1; }
PGBIN="$(dirname "$(command -v pg_ctl)")"
PGTMP=/tmp/pg_prueba
rm -rf "$PGTMP"; mkdir -p "$PGTMP"; chown postgres "$PGTMP"
su postgres -c "$PGBIN/initdb -D $PGTMP -A trust -U postgres >/dev/null"
su postgres -c "$PGBIN/pg_ctl -D $PGTMP -o '-p 55432 -k /tmp' -w start >/dev/null"
trap 'su postgres -c "$PGBIN/pg_ctl -D $PGTMP -m fast stop >/dev/null" ; rm -rf $PGTMP' EXIT
URL="postgresql://postgres@localhost:55432/postgres"

psql "$URL" -v ON_ERROR_STOP=1 -q <<'SQL'
CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
CREATE SCHEMA extensions;
CREATE EXTENSION btree_gist SCHEMA extensions;
CREATE EXTENSION pgcrypto SCHEMA extensions;
DROP SCHEMA public CASCADE;
SQL

# Las cuentas del personal viven en auth.users (fuera del volcado): se cargan sus
# identificadores para que la clave foránea de usuarios_administrativos sea válida.
pg_restore -a -t usuarios_administrativos -f - "$DUMP" \
  | awk '/^COPY public.usuarios_administrativos/{f=1;next} /^\\\./{f=0} f{print $1}' \
  | while read -r id; do psql "$URL" -q -c "INSERT INTO auth.users VALUES ('$id') ON CONFLICT DO NOTHING"; done

pg_restore --exit-on-error --no-owner --no-privileges --dbname "$URL" "$DUMP"

echo "Volcado restaurado: $DUMP"
psql "$URL" -v ON_ERROR_STOP=1 <<'SQL'
SELECT 'clinicas' AS tabla, count(*) FROM public.clinicas
UNION ALL SELECT 'profesionales', count(*) FROM public.profesionales
UNION ALL SELECT 'pacientes', count(*) FROM public.pacientes
UNION ALL SELECT 'turnos', count(*) FROM public.turnos
UNION ALL SELECT 'historial_turnos', count(*) FROM public.historial_turnos
UNION ALL SELECT 'log_comunicacion', count(*) FROM public.log_comunicacion;
SELECT conname AS restriccion FROM pg_constraint WHERE conname = 'turnos_sin_solapamiento_excl';
SELECT tgname AS disparador FROM pg_trigger WHERE NOT tgisinternal ORDER BY 1;
SQL
echo "RESTAURACIÓN VERIFICADA"
