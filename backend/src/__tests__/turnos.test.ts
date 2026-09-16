import { describe, it, expect } from 'vitest';
import { 
  CrearTurnoRequest, 
  AvanzarEstadoRequest
} from '../modules/turnos/turnos.schemas.js';

describe('Turnos - Unit Tests', () => {
  describe('Zod Validations: CrearTurnoRequest', () => {
    it('debería validar un turno correcto con paciente', () => {
      const payload = {
        clinica_id: '11111111-1111-1111-1111-111111111111',
        profesional_id: '33333333-3333-3333-3333-333333333333',
        fecha_hora_inicio: '2026-09-15T10:00:00Z',
        canal_reserva: 'manual',
        paciente: {
          nombre_completo: 'Maria Perez',
          telefono_whatsapp: '+5491112345678'
        }
      };
      
      const result = CrearTurnoRequest.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('debería fallar si falta el objeto paciente', () => {
      const payload = {
        clinica_id: '11111111-1111-1111-1111-111111111111',
        profesional_id: '33333333-3333-3333-3333-333333333333',
        fecha_hora_inicio: '2026-09-15T10:00:00Z',
        canal_reserva: 'manual',
      };
      
      const result = CrearTurnoRequest.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('Finite State Machine (FSM): AvanzarEstadoRequest', () => {
    it('debería validar transición a confirmado', () => {
      const payload = {
        nuevo_estado: 'confirmado',
      };
      
      const result = AvanzarEstadoRequest.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('debería rechazar estados inválidos', () => {
      const payload = {
        nuevo_estado: 'estado_inventado',
      };
      
      const result = AvanzarEstadoRequest.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('debería aceptar motivo si es cancelado', () => {
      const payload = {
        nuevo_estado: 'cancelado',
        motivo: 'Paciente solicitó reprogramar'
      };
      
      const result = AvanzarEstadoRequest.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });
});
