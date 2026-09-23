import { z } from 'zod';

export const CrearTurnoRequest = z.object({
  profesional_id: z.string().uuid('ID de profesional inválido'),
  clinica_id: z.string().uuid('ID de clinica inválido').optional(),
  fecha_hora_inicio: z.string().min(1, 'La fecha y hora de inicio es requerida'),
  canal_reserva: z.enum(['web', 'whatsapp', 'manual']).default('web'),
  // A-02: obligatorio (true) en el canal web; en WhatsApp el agente informa la política
  consentimiento_privacidad: z.boolean().optional(),
  // Datos del paciente (se crea o se busca)
  paciente: z.object({
    nombre_completo: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    telefono_whatsapp: z.string().min(8, 'Teléfono inválido'),
    email: z.string().email('Email inválido').optional().nullable(),
  }),
});

/** Reserva pública (turnero web): canal fijo 'web' y consentimiento obligatorio (A2-01). */
export const ReservaPublicaRequest = z.object({
  profesional_id: z.string().uuid('ID de profesional inválido'),
  clinica_id: z.string().uuid('ID de clinica inválido').optional(),
  fecha_hora_inicio: z.string().min(1, 'La fecha y hora de inicio es requerida'),
  consentimiento_privacidad: z.literal(true, {
    errorMap: () => ({ message: 'Debés aceptar la política de privacidad para reservar' }),
  }),
  paciente: z.object({
    nombre_completo: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    telefono_whatsapp: z.string().min(8, 'Teléfono inválido'),
    email: z.string().email('Email inválido').optional().nullable(),
  }),
}).strict();

/** Reserva por WhatsApp: solo n8n (x-api-key); el teléfono es el del remitente validado. */
export const ReservaWhatsappRequest = z.object({
  clinica_id: z.string().uuid(),
  telefono: z.string().min(8),
  nombre_completo: z.string().min(2).max(150),
  profesional_id: z.string().uuid(),
  fecha_hora_inicio: z.string().min(1),
}).strict();

export const EstadoEntregaRequest = z.object({
  mensaje_externo_id: z.string().min(1),
  estado: z.enum(['enviado', 'entregado', 'leido', 'fallido']),
  detalle: z.string().max(500).optional(),
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
