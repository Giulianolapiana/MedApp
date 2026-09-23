import { describe, it, expect } from 'vitest';
import { ipDelCliente, registrarIntento } from '../middleware/rate-limiter.middleware.js';

describe('Limitador de reservas (A2-02)', () => {
  it('ignora los valores de X-Forwarded-For que controla el cliente', () => {
    // El cliente envía "1.1.1.1"; Traefik agrega a la derecha la IP real de la conexión.
    expect(ipDelCliente('1.1.1.1, 200.45.10.7', '10.0.0.2', 1)).toBe('200.45.10.7');
    expect(ipDelCliente('9.9.9.9, 8.8.8.8, 200.45.10.7', '10.0.0.2', 1)).toBe('200.45.10.7');
  });
  it('sin proxy de confianza usa la dirección de la conexión', () => {
    expect(ipDelCliente('1.1.1.1', '190.1.2.3', 0)).toBe('190.1.2.3');
    expect(ipDelCliente(undefined, '190.1.2.3', 1)).toBe('190.1.2.3');
  });
  it('bloquea al superar el máximo en la ventana', () => {
    const clave = `test:${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(registrarIntento(clave, 1000, 3)).toBe(true);
    expect(registrarIntento(clave, 1000, 3)).toBe(false);
    expect(registrarIntento(clave, 1000 + 3_600_000, 3)).toBe(true);
  });
});
