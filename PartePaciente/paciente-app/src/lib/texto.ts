import { Stethoscope, HeartPulse, Baby, Eye, Bone, Activity, Smile, type LucideIcon } from 'lucide-react';

/** Minúsculas y sin tildes, para comparar búsquedas ("Pediatría" ≈ "pediatria"). */
export const normalizar = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

export function iconoEspecialidad(nombre: string): LucideIcon {
  const n = normalizar(nombre);
  if (n.includes('cardiologia')) return HeartPulse;
  if (n.includes('dermatologia')) return Activity;
  if (n.includes('pediatria')) return Baby;
  if (n.includes('ginecologia')) return HeartPulse;
  if (n.includes('traumatologia')) return Bone;
  if (n.includes('oftalmologia')) return Eye;
  if (n.includes('odontologia')) return Smile;
  return Stethoscope;
}

/** Iniciales para el avatar ("Dra. Ana López" → "AL"). */
export function iniciales(nombre: string) {
  const partes = nombre
    .replace(/^(dr|dra|lic)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean);
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}
