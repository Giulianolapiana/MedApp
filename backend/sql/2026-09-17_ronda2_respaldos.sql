-- MedApp · Migración ronda 2: registro detallado de respaldos (A-07)
BEGIN;
ALTER TABLE backups_auditoria
  ADD COLUMN IF NOT EXISTS archivo_ruta text,
  ADD COLUMN IF NOT EXISTS tamano_bytes bigint,
  ADD COLUMN IF NOT EXISTS detalle text;
ALTER TABLE backups_auditoria
  DROP CONSTRAINT IF EXISTS backups_tipo_artefacto_chk,
  ADD CONSTRAINT backups_tipo_artefacto_chk CHECK (tipo_artefacto IN ('respaldo_bd', 'tablero_agenda')) NOT VALID,
  DROP CONSTRAINT IF EXISTS backups_estado_chk,
  ADD CONSTRAINT backups_estado_chk CHECK (estado IN ('completado', 'fallido')) NOT VALID;
CREATE INDEX IF NOT EXISTS backups_clinica_fecha_idx ON backups_auditoria (clinica_id, creado_en DESC);
COMMIT;
