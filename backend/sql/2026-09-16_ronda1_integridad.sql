-- =====================================================================
-- MedApp · Migración ronda 1 de correcciones del tribunal
-- Hallazgos: K-07 (solapamiento), A-01 (zona horaria), A-05 (idempotencia
-- de recordatorios), A-10 (máquina de estados y borrado en cascada),
-- A-07 (auditoría de transiciones).
--
-- ANTES DE CORRER:
--   1. Hacer backup (Supabase > Database > Backups, o pg_dump).
--   2. Correr primero la sección 0 (diagnóstico) y revisar resultados.
--   3. Correr el resto dentro de una transacción (ya incluida).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. DIAGNÓSTICO (correr solo, revisar, NO modifica nada)
-- ---------------------------------------------------------------------
-- Tipo real de las columnas de fecha:
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'turnos' AND column_name LIKE 'fecha%';
-- Turnos activos que YA se solapan (hay que resolverlos antes del paso 3):
--   SELECT a.id, b.id, a.profesional_id, a.fecha_hora_inicio
--   FROM turnos a JOIN turnos b
--     ON a.profesional_id = b.profesional_id AND a.id < b.id
--    AND a.estado IN ('pendiente','confirmado') AND b.estado IN ('pendiente','confirmado')
--    AND a.fecha_hora_inicio::timestamptz = b.fecha_hora_inicio::timestamptz;

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Tipos de fecha: instantes reales en UTC (A-01)
-- ---------------------------------------------------------------------
ALTER TABLE turnos
  ALTER COLUMN fecha_hora_inicio TYPE timestamptz USING fecha_hora_inicio::timestamptz,
  ALTER COLUMN fecha_hora_fin    TYPE timestamptz USING fecha_hora_fin::timestamptz;

-- 1.b CORRECCIÓN DE DATOS HISTÓRICOS (opcional, leer antes).
-- Hasta esta versión, el turnero web y el agente de WhatsApp guardaban la hora
-- local rotulada como UTC (10:00 local -> 10:00Z), mientras el panel guardaba
-- UTC real (10:00 local -> 13:00Z). Si los datos existentes son de prueba,
-- lo más limpio es borrarlos. Si hay que conservarlos, descomentar:
-- UPDATE turnos
--    SET fecha_hora_inicio = fecha_hora_inicio + interval '3 hours',
--        fecha_hora_fin    = fecha_hora_fin    + interval '3 hours'
--  WHERE canal_reserva IN ('web','whatsapp')
--    AND creado_en < now();

UPDATE turnos
   SET fecha_hora_fin = fecha_hora_inicio + interval '30 minutes'
 WHERE fecha_hora_fin IS NULL;

ALTER TABLE turnos
  ALTER COLUMN fecha_hora_fin SET NOT NULL,
  ADD CONSTRAINT turnos_fin_posterior_chk CHECK (fecha_hora_fin > fecha_hora_inicio);

-- ---------------------------------------------------------------------
-- 2. No solapamiento garantizado por la base (K-07, RN-02, HU-3.2)
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE turnos
  ADD CONSTRAINT turnos_sin_solapamiento_excl
  EXCLUDE USING gist (
    profesional_id WITH =,
    tstzrange(fecha_hora_inicio, fecha_hora_fin, '[)') WITH &&
  )
  WHERE (estado IN ('pendiente', 'confirmado'));

-- ---------------------------------------------------------------------
-- 3. Máquina de estados también en la base (A-10, RN-04)
--    La API ya valida con turnos.fsm.ts; esto es defensa en profundidad
--    para cualquier otro cliente (n8n, SQL directo).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validar_transicion_turno()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.estado = OLD.estado THEN
    RETURN NEW;
  END IF;
  IF NOT (
       (OLD.estado = 'pendiente'  AND NEW.estado IN ('confirmado','cancelado'))
    OR (OLD.estado = 'confirmado' AND NEW.estado IN ('asistido','cancelado','no_show'))
  ) THEN
    RAISE EXCEPTION 'Transición de estado inválida: % -> %', OLD.estado, NEW.estado
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validar_transicion_turno ON turnos;
CREATE TRIGGER trg_validar_transicion_turno
  BEFORE UPDATE OF estado ON turnos
  FOR EACH ROW EXECUTE FUNCTION validar_transicion_turno();

-- Historial append-only: prohibir UPDATE y DELETE (A-07, "bitácora inmutable")
CREATE OR REPLACE FUNCTION impedir_modificacion_historial()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'historial_turnos es de solo inserción';
END $$;

DROP TRIGGER IF EXISTS trg_historial_inmutable ON historial_turnos;
CREATE TRIGGER trg_historial_inmutable
  BEFORE UPDATE OR DELETE ON historial_turnos
  FOR EACH ROW EXECUTE FUNCTION impedir_modificacion_historial();

-- ---------------------------------------------------------------------
-- 4. Sin borrado en cascada de pacientes hacia turnos (A-10)
--    Se usa baja lógica (pacientes.activo). Se recrea la FK con RESTRICT.
-- ---------------------------------------------------------------------
DO $$
DECLARE fk text;
BEGIN
  FOR fk IN
    SELECT con.conname FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
    WHERE rel.relname = 'turnos' AND con.contype = 'f' AND att.attname = 'paciente_id'
  LOOP
    EXECUTE format('ALTER TABLE turnos DROP CONSTRAINT %I', fk);
  END LOOP;
END $$;

ALTER TABLE turnos
  ADD CONSTRAINT turnos_paciente_id_fkey
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE RESTRICT;

-- ---------------------------------------------------------------------
-- 5. Bitácora de comunicaciones e idempotencia de recordatorios (A-05, K-05)
-- ---------------------------------------------------------------------
ALTER TABLE log_comunicacion
  ADD COLUMN IF NOT EXISTS mensaje_externo_id text,   -- id del mensaje en Chatwoot/WhatsApp
  ADD COLUMN IF NOT EXISTS detalle text;

-- Un único recordatorio por turno: un segundo INSERT falla.
CREATE UNIQUE INDEX IF NOT EXISTS log_comunicacion_un_recordatorio_por_turno
  ON log_comunicacion (turno_id) WHERE tipo = 'recordatorio';

-- ---------------------------------------------------------------------
-- 5.b Consentimiento informado (A-02, Ley 25.326 art. 5)
-- ---------------------------------------------------------------------
ALTER TABLE pacientes
  ADD COLUMN IF NOT EXISTS consentimiento_en timestamptz,
  ADD COLUMN IF NOT EXISTS consentimiento_canal text;

-- 5.c Teléfonos en formato E.164 (+549...). Revisar antes con:
--   SELECT telefono_whatsapp FROM pacientes WHERE telefono_whatsapp !~ '^\+549\d{10}$';
-- Normalización simple para números cargados como 10 dígitos:
UPDATE pacientes SET telefono_whatsapp = '+549' || telefono_whatsapp
 WHERE telefono_whatsapp ~ '^\d{10}$';

-- ---------------------------------------------------------------------
-- 6. Índices de consulta
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS turnos_profesional_inicio_idx
  ON turnos (profesional_id, fecha_hora_inicio);
CREATE INDEX IF NOT EXISTS pacientes_clinica_telefono_idx
  ON pacientes (clinica_id, telefono_whatsapp);

COMMIT;
