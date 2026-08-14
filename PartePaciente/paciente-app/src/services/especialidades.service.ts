import { supabase, clinicaId } from '../lib/supabase';
import { mockEspecialidades } from '../data/mock'; // Fallback para íconos
import type { Especialidad } from '../types';

export async function getEspecialidades(): Promise<Especialidad[]> {
  const { data, error } = await supabase
    .from('especialidades')
    .select('id, nombre')
    .eq('clinica_id', clinicaId)
    .order('nombre');

  if (error) {
    console.error("Error al obtener especialidades:", error);
    return [];
  }

  // Devolver las especialidades (el icono lo asignamos localmente en el componente según el ID o nombre si es necesario)
  return data.map((esp: any) => ({
    id: esp.id,
    nombre: esp.nombre
  }));
}
