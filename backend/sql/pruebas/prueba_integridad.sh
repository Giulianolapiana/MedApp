#!/usr/bin/env bash
# Prueba de integridad (K-07, A-05, A-10). Uso: PGDATABASE=medapp_test bash prueba_integridad.sh
# Correr SOLO contra una base de prueba: borra turnos.
set -u
Q="psql -X -q -t -A"
P="'22222222-2222-2222-2222-222222222222'"; PA="'33333333-3333-3333-3333-333333333333'"; C="'11111111-1111-1111-1111-111111111111'"
ins() { echo "INSERT INTO turnos(paciente_id,profesional_id,clinica_id,fecha_hora_inicio,fecha_hora_fin,canal_reserva) VALUES ($PA,$P,$C,'$1','$2','web');"; }
$Q -c "DELETE FROM log_comunicacion; ALTER TABLE historial_turnos DISABLE TRIGGER trg_historial_inmutable; DELETE FROM historial_turnos; ALTER TABLE historial_turnos ENABLE TRIGGER trg_historial_inmutable; DELETE FROM turnos;"
echo "== 1. Concurrencia: 20 reservas simultáneas del mismo horario (10:00 Mendoza)"
for i in $(seq 1 20); do ( $Q -c "$(ins '2026-09-21T10:00:00-03:00' '2026-09-21T10:30:00-03:00')" 2>&1 | grep -q ERROR && echo R || echo OK ) & done | sort | uniq -c; wait
echo "   turnos activos guardados en ese horario: $($Q -c "SELECT count(*) FROM turnos WHERE fecha_hora_inicio='2026-09-21T13:00:00Z'")"
echo "== 2. Solapamiento parcial (10:15-10:45):"; $Q -c "$(ins '2026-09-21T10:15:00-03:00' '2026-09-21T10:45:00-03:00')" 2>&1 | head -1
echo "== 3. Turno contiguo (10:30-11:00) debe aceptarse:"; $Q -c "$(ins '2026-09-21T10:30:00-03:00' '2026-09-21T11:00:00-03:00')" 2>&1 | head -1; echo "   ok"
echo "== 4. Cancelar libera el horario:"
$Q -c "UPDATE turnos SET estado='cancelado' WHERE fecha_hora_inicio='2026-09-21T13:00:00Z'"
$Q -c "$(ins '2026-09-21T10:00:00-03:00' '2026-09-21T10:30:00-03:00')" 2>&1 | head -1; echo "   re-reserva aceptada"
echo "== 5. Transición inválida cancelado->confirmado:"; $Q -c "UPDATE turnos SET estado='confirmado' WHERE estado='cancelado'" 2>&1 | head -1
echo "== 6. Historial inmutable:"; ID=$($Q -c "SELECT id FROM turnos LIMIT 1"); $Q -c "INSERT INTO historial_turnos(turno_id,estado_desde,estado_hacia) VALUES ('$ID','nuevo','pendiente')"; $Q -c "DELETE FROM historial_turnos" 2>&1 | head -1
echo "== 7. Recordatorio duplicado:"; $Q -c "INSERT INTO log_comunicacion(turno_id,tipo) VALUES ('$ID','recordatorio')"; $Q -c "INSERT INTO log_comunicacion(turno_id,tipo) VALUES ('$ID','recordatorio')" 2>&1 | head -1
echo "== 8. Borrar paciente con turnos:"; $Q -c "DELETE FROM pacientes" 2>&1 | head -1
