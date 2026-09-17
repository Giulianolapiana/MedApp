-- =====================================================================
-- MedApp · Migración ronda 3: endurecimiento del esquema real
-- Surge de revisar backend/sql/esquema.sql (volcado de producción).
-- Hallazgos del tribunal: A-04 (RLS y acceso anónimo), A-06 (webhook de
-- base de datos no documentado), K-08 (esquema coherente y documentado).
--
-- Principio: TODA escritura pasa por la API (valida consentimiento, zona
-- horaria, teléfono, FSM y límite de reservas). La base conserva RLS de
-- solo lectura por clínica como segunda barrera para usuarios autenticados
-- y no concede nada al rol anónimo.
-- Antes de correr: backup. Es idempotente.
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- 1. Webhook de base de datos heredado (A-06)
--    Enviaba cada alta o cambio de turno, con nombre, teléfono y email del
--    paciente, a una URL de ngrok de desarrollo. Duplica la notificación que
--    ya hace la API después del commit.
-- ---------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS on_turno_change ON public.turnos;
-- DROP FUNCTION IF EXISTS public.notify_n8n_turno();

-- ---------------------------------------------------------------------
-- 2. Rol anónimo sin acceso (A-04)
--    Las políticas "portal:*" permitían insertar pacientes y turnos y leer
--    turnos directamente con la clave anónima, salteando la API.
--    El turnero ya consume la API, por lo que no se necesitan.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "portal: insertar o actualizar paciente" ON public.pacientes;
DROP POLICY IF EXISTS "portal: insertar turno vía web"          ON public.turnos;
DROP POLICY IF EXISTS "portal: leer disponibilidad habilitada"  ON public.disponibilidad;
DROP POLICY IF EXISTS "portal: leer especialidades"             ON public.especialidades;
DROP POLICY IF EXISTS "portal: leer fechas de turnos ocupados"  ON public.turnos;
DROP POLICY IF EXISTS "portal: leer profesionales activos"      ON public.profesionales;
DO $$ BEGIN
  IF to_regrole('anon') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 3. Usuarios autenticados: solo lectura dentro de su clínica (A-04)
--    Se eliminan las políticas de escritura; se reemplazan las "FOR ALL"
--    por políticas de lectura equivalentes.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin y Recepcion pueden actualizar turnos"   ON public.turnos;
DROP POLICY IF EXISTS "Admin y Recepcion pueden insertar turnos"     ON public.turnos;
DROP POLICY IF EXISTS "Crear o actualizar pacientes en su clinica"  ON public.pacientes;
DROP POLICY IF EXISTS "Modificar pacientes en su clinica"           ON public.pacientes;
DROP POLICY IF EXISTS "Insertar logs en la clinica"                 ON public.log_comunicacion;
DROP POLICY IF EXISTS "Solo admin gestiona disponibilidad"          ON public.disponibilidad;
DROP POLICY IF EXISTS "Solo admin gestiona profesionales"           ON public.profesionales;
DROP POLICY IF EXISTS "Solo administradores gestionan usuarios"     ON public.usuarios_administrativos;
DROP POLICY IF EXISTS "admin: gestionar especialidades de su clinica" ON public.especialidades;
DROP POLICY IF EXISTS "Solo admin ve y gestiona backups"            ON public.backups_auditoria;

-- Solo en Supabase (existen el rol authenticated y las funciones get_auth_*)
DO $$ BEGIN
  IF to_regrole('authenticated') IS NOT NULL AND to_regprocedure('public.get_auth_clinica_id()') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Ver especialidades de la clinica" ON public.especialidades';
    EXECUTE 'CREATE POLICY "Ver especialidades de la clinica" ON public.especialidades
               FOR SELECT TO authenticated USING (clinica_id = public.get_auth_clinica_id())';
    EXECUTE 'DROP POLICY IF EXISTS "Admin ve backups de su clinica" ON public.backups_auditoria';
    EXECUTE 'CREATE POLICY "Admin ve backups de su clinica" ON public.backups_auditoria
               FOR SELECT TO authenticated
               USING (clinica_id = public.get_auth_clinica_id() AND public.get_auth_rol() = ''ADMINISTRADOR'')';
    EXECUTE 'REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM authenticated';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 4. Claves foráneas duplicadas
--    Coexistían las originales (*_fkey) y las creadas por drizzle-kit (*_fk),
--    con reglas ON DELETE contradictorias. Se conservan las *_fkey.
--    IMPORTANTE: no usar `drizzle-kit push` contra producción (las recrearía);
--    los cambios de esquema se aplican con scripts SQL versionados.
-- ---------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conrelid::regclass AS tabla, c.conname
    FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'public' AND c.contype = 'f' AND c.conname LIKE '%\_fk' ESCAPE '\'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tabla, r.conname);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 5. Índices redundantes
--    (clinica_id, telefono_whatsapp) ya está cubierto por la restricción
--    UNIQUE unq_paciente_telefono_por_clinica.
-- ---------------------------------------------------------------------
DROP INDEX IF EXISTS public.pacientes_clinica_telefono_idx;
DROP INDEX IF EXISTS public.idx_pacientes_clinica_tel;
DROP INDEX IF EXISTS public.turnos_profesional_inicio_idx;   -- duplica idx_turnos_profesional_fecha

-- ---------------------------------------------------------------------
-- 6. Documentación en el propio esquema
-- ---------------------------------------------------------------------
COMMENT ON TABLE public.turnos IS 'Turnos. Invariantes: sin solapamiento por profesional (EXCLUDE), transiciones validadas por trigger, fin > inicio.';
COMMENT ON TABLE public.historial_turnos IS 'Bitácora append-only de transiciones de estado (trigger impide UPDATE/DELETE).';
COMMENT ON TABLE public.log_comunicacion IS 'Mensajes enviados y respuestas del paciente; índice único impide recordatorios duplicados.';
COMMENT ON TABLE public.backups_auditoria IS 'Registro de respaldos: respaldo_bd (pg_dump en VPS) y tablero_agenda (Google Sheets).';
COMMENT ON COLUMN public.pacientes.telefono_whatsapp IS 'Formato E.164 (+549...), normalizado por la API.';
COMMENT ON COLUMN public.pacientes.consentimiento_en IS 'Momento en que el paciente aceptó la política de privacidad (Ley 25.326).';

COMMIT;
