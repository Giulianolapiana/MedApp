import { z } from 'zod';

export const CrearEspecialidadRequest = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
});

export const ActualizarEspecialidadRequest = z.object({
  nombre: z.string().min(2).max(100).optional(),
});

export type CrearEspecialidadType = z.infer<typeof CrearEspecialidadRequest>;
export type ActualizarEspecialidadType = z.infer<typeof ActualizarEspecialidadRequest>;
