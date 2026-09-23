-- =====================================================================
-- MedApp · Migración ronda 4 (segunda devolución del tribunal)
-- K2-02: garantiza la eliminación del webhook heredado (idempotente).
-- A2-05: estado de entrega de los recordatorios; un envío fallido no bloquea
--        el reintento.
-- Antes de correr: backup. Es idempotente.
-- =====================================================================
BEGIN;

-- K2-02 · webhook de base heredado (enviaba datos del paciente a un túnel de desarrollo)
DROP TRIGGER IF EXISTS on_turno_change ON public.turnos;
DROP FUNCTION IF EXISTS public.notify_n8n_turno();

-- A2-05 · estado de entrega
ALTER TABLE public.log_comunicacion
  ADD COLUMN IF NOT EXISTS estado_entrega text NOT NULL DEFAULT 'enviado';
ALTER TABLE public.log_comunicacion DROP CONSTRAINT IF EXISTS log_estado_entrega_chk;
ALTER TABLE public.log_comunicacion
  ADD CONSTRAINT log_estado_entrega_chk
  CHECK (estado_entrega IN ('enviado', 'entregado', 'leido', 'fallido'));

-- Un único recordatorio vigente por turno; los fallidos no cuentan y permiten reintentar.
DROP INDEX IF EXISTS public.log_comunicacion_un_recordatorio_por_turno;
CREATE UNIQUE INDEX log_comunicacion_un_recordatorio_por_turno
  ON public.log_comunicacion (turno_id)
  WHERE tipo = 'recordatorio' AND estado_entrega <> 'fallido';

CREATE INDEX IF NOT EXISTS log_comunicacion_mensaje_externo_idx
  ON public.log_comunicacion (mensaje_externo_id);

COMMIT;

-- Verificación (correr después, en producción):
--   SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.turnos'::regclass AND NOT tgisinternal;
--   -- debe devolver solo: trg_validar_transicion_turno
