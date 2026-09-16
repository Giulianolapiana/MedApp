import { ErrorHandler } from 'hono';
import { AppError } from '../core/errors.js';
import { ZodError } from 'zod';
import { logger } from '../core/logger.js';

export const errorHandler: ErrorHandler = (err, c) => {
  logger.error({ err, path: c.req.path, method: c.req.method }, 'Error atrapado por errorHandler');

  // Si es nuestro AppError personalizado
  if (err instanceof AppError) {
    return c.json(
      {
        detail: err.message,
        code: err.code,
      },
      err.statusCode as any
    );
  }

  // Si es un error de validación de Zod
  if (err instanceof ZodError) {
    return c.json(
      {
        detail: 'Error de validación en la solicitud',
        code: 'VALIDATION_ERROR',
        errors: err.errors,
      },
      400
    );
  }

  // Error genérico no controlado
  return c.json(
    {
      detail: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    },
    500
  );
};
