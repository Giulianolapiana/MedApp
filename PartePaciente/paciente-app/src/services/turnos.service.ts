import { fetchApi } from '../lib/api';
import { format } from 'date-fns';
import type { Slot, DatosPaciente } from '../types';

export async function getDisponibilidadDia(fecha: Date, medicoId: string): Promise<Slot[]> {
  try {
    const fechaStr = format(fecha, 'yyyy-MM-dd');
    const slots = await fetchApi<Slot[]>(`/disponibilidad/${medicoId}/slots?fecha=${fechaStr}`);
    return slots;
  } catch (error) {
    console.error('Error al obtener disponibilidad:', error);
    return [];
  }
}

/**
 * Obtiene los días de la semana (0=Dom, 1=Lun, ..., 6=Sab) en que el médico atiende.
 */
export async function getDiasDisponibles(medicoId: string): Promise<number[]> {
  try {
    return await fetchApi<number[]>(`/disponibilidad/${medicoId}/dias`);
  } catch (error) {
    console.error('Error al obtener días disponibles:', error);
    return [];
  }
}

export async function crearTurno(medicoId: string, fecha: Date, hora: string, pacienteInfo: DatosPaciente, consentimientoPrivacidad: boolean) {
  try {
    const fechaStr = format(fecha, 'yyyy-MM-dd');
    // Hora local del consultorio SIN 'Z': el backend la interpreta en America/Argentina/Mendoza (A-01).
    // Antes se enviaba `...:00.000Z`, lo que rotulaba la hora local como UTC.
    const fechaHoraInicioIso = `${fechaStr}T${hora}:00`;
    
    // Note: el backend ahora se encarga de crear/encontrar al paciente y de crear el turno 
    // atómicamente con una Unit of Work, y verificar que el slot no esté tomado.
    await fetchApi('/turnos', {
      method: 'POST',
      body: JSON.stringify({
        profesional_id: medicoId,
        fecha_hora_inicio: fechaHoraInicioIso,
        // El canal lo fija el servidor (siempre 'web' en el endpoint público)
        consentimiento_privacidad: consentimientoPrivacidad,
        clinica_id: import.meta.env.VITE_CLINICA_ID,
        paciente: {
          nombre_completo: `${pacienteInfo.nombre} ${pacienteInfo.apellido}`,
          telefono_whatsapp: pacienteInfo.celular,
          email: pacienteInfo.email || null,
        }
      })
    });
    
    return true;
  } catch (error: any) {
    throw new Error(error.message || 'Error al reservar el turno');
  }
}
