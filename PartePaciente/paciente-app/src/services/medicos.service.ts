import { fetchApi } from '../lib/api';
import type { Medico } from '../types';

export async function getMedicosByEspecialidad(especialidadNombre: string): Promise<Medico[]> {
  try {
    const data = await fetchApi<any[]>(`/profesionales?especialidad=${encodeURIComponent(especialidadNombre)}`);
    
    // Mapeamos el modelo de BD al modelo de UI
    return data.map((p: any) => ({
      id: p.id,
      nombre: p.nombre,
      especialidadId: p.especialidad, // Usamos el nombre como ID para compatibilidad
      especialidadNombre: p.especialidad,
      diasAtencion: ['Lunes a Viernes'], // Fallback estático
      bio: 'Profesional de excelencia en nuestra clínica.',
      fotoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nombre)}&background=random`
    }));
  } catch (error) {
    console.error('Error fetching medicos:', error);
    return [];
  }
}
