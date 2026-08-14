import type { Especialidad, Medico, DisponibilidadDia, Slot } from '../../types';

export const mockEspecialidades: Especialidad[] = [
  { id: 'clinica-medica', nombre: 'Clínica Médica' },
  { id: 'cardiologia', nombre: 'Cardiología' },
  { id: 'dermatologia', nombre: 'Dermatología' },
  { id: 'pediatria', nombre: 'Pediatría' },
  { id: 'ginecologia', nombre: 'Ginecología' },
  { id: 'traumatologia', nombre: 'Traumatología' },
  { id: 'oftalmologia', nombre: 'Oftalmología' },
  { id: 'odontologia', nombre: 'Odontología' },
];

export const mockMedicos: Medico[] = [
  {
    id: 'm1',
    nombre: 'Dr. Juan Pérez',
    especialidadId: 'cardiologia',
    especialidadNombre: 'Cardiología',
    diasAtencion: ['Lunes', 'Miércoles', 'Viernes'],
    fotoUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=250&auto=format&fit=crop',
    bio: 'Especialista en prevención cardiovascular y arritmias con más de 15 años de experiencia.'
  },
  {
    id: 'm2',
    nombre: 'Dra. María González',
    especialidadId: 'cardiologia',
    especialidadNombre: 'Cardiología',
    diasAtencion: ['Martes', 'Jueves'],
    fotoUrl: 'https://images.unsplash.com/photo-1594824436998-d8ea3a0c7042?q=80&w=250&auto=format&fit=crop',
    bio: 'Cardióloga clínica con enfoque en insuficiencia cardíaca y rehabilitación.'
  },
  {
    id: 'm3',
    nombre: 'Dr. Carlos Rodríguez',
    especialidadId: 'clinica-medica',
    especialidadNombre: 'Clínica Médica',
    diasAtencion: ['Lunes', 'Martes', 'Jueves', 'Viernes'],
    fotoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=250&auto=format&fit=crop',
    bio: 'Atención integral del adulto. Chequeos preventivos y control de enfermedades crónicas.'
  }
];

// Generar slots simulados para una fecha dada
export function generateMockSlots(fecha: Date): Slot[] {
  const isWeekend = fecha.getDay() === 0 || fecha.getDay() === 6;
  if (isWeekend) return []; // No atienden fines de semana

  const slots = [];
  const horas = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
  
  // Hacer que algunos estén ocupados aleatoriamente (seed fijo por día)
  const seed = fecha.getDate();
  
  for (let i = 0; i < horas.length; i++) {
    // Falsa aleatoriedad para que sea consistente
    const disponible = (seed + i) % 3 !== 0; 
    slots.push({ hora: horas[i], disponible });
  }
  
  return slots;
}
