import { fetchApi } from '../lib/api';
import type { Medico } from '../types';

export interface ProfesionalApi {
  id: string;
  nombre: string;
  especialidad: string;
  activo: boolean;
}

/** Modelo de la API → modelo de la UI del turnero. */
export function aMedico(p: Pick<ProfesionalApi, 'id' | 'nombre' | 'especialidad'>): Medico {
  return {
    id: p.id,
    nombre: p.nombre,
    especialidadId: p.especialidad, // Usamos el nombre como ID para compatibilidad
    especialidadNombre: p.especialidad,
    diasAtencion: [],
    bio: '',
    fotoUrl: '',
  };
}

export async function getProfesionalesActivos(): Promise<ProfesionalApi[]> {
  const data = await fetchApi<ProfesionalApi[]>('/profesionales');
  return data.filter((p) => p.activo);
}

export async function getMedicosByEspecialidad(especialidadNombre: string): Promise<Medico[]> {
  try {
    const data = await fetchApi<ProfesionalApi[]>(`/profesionales?especialidad=${encodeURIComponent(especialidadNombre)}`);
    return data.map(aMedico);
  } catch (error) {
    console.error('Error fetching medicos:', error);
    return [];
  }
}
