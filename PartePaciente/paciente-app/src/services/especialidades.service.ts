import { fetchApi } from '../lib/api';
import type { Especialidad } from '../types';

export async function getEspecialidades(): Promise<Especialidad[]> {
  try {
    const data = await fetchApi<any[]>('/especialidades');
    
    return data.map((esp: any) => ({
      id: esp.id,
      nombre: esp.nombre
    }));
  } catch (error) {
    console.error("Error al obtener especialidades:", error);
    return [];
  }
}
