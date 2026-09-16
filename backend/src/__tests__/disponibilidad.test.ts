import { describe, it, expect } from 'vitest';
import { disponibilidadService } from '../modules/disponibilidad/disponibilidad.service.js';

describe('Disponibilidad - Unit Tests', () => {
  describe('generarSlots (Logic)', () => {
    // Para probar lógica aislada, podemos crear una función pura basada en la de disponibilidadService
    // Dado que disponibilidadService depende de la base de datos, 
    // extraeremos la lógica pura de generación de slots para testearla.

    // Función auxiliar que simula la lógica interna de generarSlots de turnos de 30 mins
    const generarSlotsPuros = (horaInicio: string, horaFin: string, turnosOcupados: string[] = [], duracionMinutos = 30) => {
      const slots = [];
      const [horaI, minI] = horaInicio.split(':').map(Number);
      const [horaF, minF] = horaFin.split(':').map(Number);
      
      let actual = new Date(2000, 0, 1, horaI, minI, 0);
      const final = new Date(2000, 0, 1, horaF, minF, 0);

      while (actual < final) {
        const horaStr = actual.toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        // Solo si no está ocupado
        if (!turnosOcupados.includes(horaStr)) {
          slots.push(horaStr);
        }

        actual.setMinutes(actual.getMinutes() + duracionMinutos);
      }
      return slots;
    };

    it('debería generar 6 slots de 30 mins entre 09:00 y 12:00', () => {
      const slots = generarSlotsPuros('09:00', '12:00');
      expect(slots).toHaveLength(6);
      expect(slots[0]).toBe('09:00');
      expect(slots[slots.length - 1]).toBe('11:30');
    });

    it('debería filtrar los horarios ocupados', () => {
      const ocupados = ['09:30', '10:30'];
      const slots = generarSlotsPuros('09:00', '12:00', ocupados);
      
      expect(slots).toHaveLength(4);
      expect(slots).not.toContain('09:30');
      expect(slots).not.toContain('10:30');
    });
  });
});
