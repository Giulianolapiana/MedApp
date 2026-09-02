import { z } from 'zod';

export const CrearProfesionalRequest = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  especialidad: z.string().min(2, 'La especialidad es requerida'),
  usuario_id: z.string().uuid().optional().nullable(),
  google_calendar_id: z.string().optional().nullable(),
  crear_acceso: z.boolean().optional(),
  email_acceso: z.string().email('Email de acceso inválido').optional().nullable(),
  password_acceso: z.string().min(6, 'Mínimo 6 caracteres').optional().nullable(),
});

export const ActualizarProfesionalRequest = z.object({
  nombre: z.string().min(2).max(100).optional(),
  especialidad: z.string().min(2).optional(),
  activo: z.boolean().optional(),
  usuario_id: z.string().uuid().optional().nullable(),
  google_calendar_id: z.string().optional().nullable(),
});

export type CrearProfesionalType = z.infer<typeof CrearProfesionalRequest>;
export type ActualizarProfesionalType = z.infer<typeof ActualizarProfesionalRequest>;
