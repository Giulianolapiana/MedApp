/**
 * Máquina de Estados Finitos para Turnos (inspirada en FSM Pedidos de Food Store).
 *
 * Estados:
 *   pendiente  → confirmado, cancelado
 *   confirmado → asistido, cancelado, no_show
 *   asistido   → (terminal)
 *   cancelado  → (terminal)
 *   no_show    → (terminal)
 *
 * Reglas de Negocio:
 *   RN-01: Un estado terminal no admite transiciones salientes.
 *   RN-02: El historial se registra como estado_desde → estado_hacia (append-only).
 *   RN-03: Motivo obligatorio cuando nuevo_estado = 'cancelado'.
 *   RN-04: Las notificaciones se emiten DESPUÉS del commit, fuera del UoW.
 */
export type EstadoTurno = 'pendiente' | 'confirmado' | 'cancelado' | 'asistido' | 'no_show';

const TRANSICIONES: Record<EstadoTurno, EstadoTurno[]> = {
  pendiente:  ['confirmado', 'cancelado'],
  confirmado: ['asistido', 'cancelado', 'no_show'],
  asistido:   [],
  cancelado:  [],
  no_show:    [],
};

export function validarTransicion(actual: EstadoTurno, nuevo: EstadoTurno): boolean {
  return TRANSICIONES[actual]?.includes(nuevo) ?? false;
}

export function esTerminal(estado: EstadoTurno): boolean {
  return TRANSICIONES[estado]?.length === 0;
}

export function getTransicionesPosibles(estado: EstadoTurno): EstadoTurno[] {
  return TRANSICIONES[estado] || [];
}
