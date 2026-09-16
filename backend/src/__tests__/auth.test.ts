import { describe, it, expect } from 'vitest';
import { LoginRequest } from '../modules/auth/auth.schemas.js';

describe('Auth - Unit Tests', () => {
  describe('Zod Validations: LoginRequest', () => {
    it('debería validar credenciales correctas', () => {
      const payload = {
        email: 'test@example.com',
        password: 'Password123!',
      };
      
      const result = LoginRequest.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('debería rechazar un email inválido', () => {
      const payload = {
        email: 'testexample.com', // Sin @
        password: 'Password123!',
      };
      
      const result = LoginRequest.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Email inválido');
      }
    });

    it('debería rechazar una contraseña muy corta', () => {
      const payload = {
        email: 'test@example.com',
        password: '123',
      };
      
      const result = LoginRequest.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('La contraseña debe tener al menos 6 caracteres');
      }
    });
  });
});
