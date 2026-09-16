import { z } from 'zod';

export const LoginRequest = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const AuthResponse = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    nombre: z.string(),
    rol: z.string(),
    clinica_id: z.string().uuid(),
  }),
});

export const RefreshRequest = z.object({
  refresh_token: z.string().min(1, 'Refresh token requerido'),
});

export type LoginRequestType = z.infer<typeof LoginRequest>;
export type RefreshRequestType = z.infer<typeof RefreshRequest>;
