import { z } from 'zod';

export const CrearPacienteRequest = z.object({
  nombre_completo: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  telefono_whatsapp: z.string().min(8, 'Teléfono inválido').max(20),
  email: z.string().email('Email inválido').optional().nullable(),
  fecha_nacimiento: z.string().optional().nullable(),
});

export const ActualizarPacienteRequest = z.object({
  nombre_completo: z.string().min(2).max(100).optional(),
  telefono_whatsapp: z.string().min(8).max(20).optional(),
  email: z.string().email().optional().nullable(),
  fecha_nacimiento: z.string().optional().nullable(),
  activo: z.boolean().optional(),
});

export type CrearPacienteType = z.infer<typeof CrearPacienteRequest>;
export type ActualizarPacienteType = z.infer<typeof ActualizarPacienteRequest>;
