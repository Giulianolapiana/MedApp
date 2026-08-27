import { z } from 'zod';

export const ConfigDisponibilidadItem = z.object({
  dia_semana: z.number().int().min(0).max(6),
  horario_inicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  horario_fin: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  habilitado: z.boolean(),
});

export const GuardarDisponibilidadRequest = z.object({
  items: z.array(ConfigDisponibilidadItem).min(1, 'Debe enviar al menos un día'),
});

export type ConfigDisponibilidadItemType = z.infer<typeof ConfigDisponibilidadItem>;
export type GuardarDisponibilidadType = z.infer<typeof GuardarDisponibilidadRequest>;
