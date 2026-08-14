import { supabase, clinicaId } from '../lib/supabase';
import type { Medico } from '../types';

export async function getMedicosByEspecialidad(especialidadNombre: string): Promise<Medico[]> {
  const { data, error } = await supabase
    .from('profesionales')
    .select('*')
    .eq('clinica_id', clinicaId)
    .eq('especialidad', especialidadNombre)
    .eq('activo', true);
    
  if (error) {
    console.error('Error fetching medicos:', error);
    return [];
  }

  // Mapeamos el modelo de BD al modelo de UI
  return data.map(p => ({
    id: p.id,
    nombre: p.nombre,
    especialidadId: p.especialidad, // Usamos el nombre como ID para compatibilidad
    especialidadNombre: p.especialidad,
    diasAtencion: ['Lunes a Viernes'], // Por ahora un fallback estático, luego se puede sacar de la tabla disponibilidad si se quiere
    bio: 'Profesional de excelencia en nuestra clínica.',
    fotoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nombre)}&background=random`
  }));
}
