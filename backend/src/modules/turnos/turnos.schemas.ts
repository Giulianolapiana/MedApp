import { z } from 'zod';

export const CrearTurnoRequest = z.object({
  profesional_id: z.string().uuid('ID de profesional inválido'),
  fecha_hora_inicio: z.string().min(1, 'La fecha y hora de inicio es requerida'),
  canal_reserva: z.enum(['web', 'whatsapp', 'manual']).default('web'),
  // Datos del paciente (se crea o se busca)
  paciente: z.object({
    nombre_completo: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    telefono_whatsapp: z.string().min(8, 'Teléfono inválido'),
    email: z.string().email('Email inválido').optional().nullable(),
  }),
});

export const AvanzarEstadoRequest = z.object({
  nuevo_estado: z.enum(['confirmado', 'asistido', 'cancelado', 'no_show']),
  motivo: z.string().optional(),
});

export const ListarTurnosQuery = z.object({
  fecha: z.string().optional(),
  profesional_id: z.string().uuid().optional(),
  estado: z.string().optional(),
  page: z.string().transform(Number).default('1'),
  size: z.string().transform(Number).default('20'),
});

export type CrearTurnoType = z.infer<typeof CrearTurnoRequest>;
export type AvanzarEstadoType = z.infer<typeof AvanzarEstadoRequest>;
