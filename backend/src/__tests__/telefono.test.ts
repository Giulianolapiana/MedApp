import { describe, it, expect } from 'vitest';
import { normalizarTelefonoAR } from '../core/telefono.js';

describe('normalizarTelefonoAR (correlación entre canales)', () => {
  it.each([
    ['2614123456'], ['+5492614123456'], ['5492614123456'], ['+54 261 4123456'],
    ['0261 154123456'], ['(0261) 15-412-3456'], ['00549 261 4123456'],
  ])('%s → +5492614123456', (e) => {
    expect(normalizarTelefonoAR(e)).toBe('+5492614123456');
  });
  it('funciona con característica de Buenos Aires', () => {
    expect(normalizarTelefonoAR('11 2233 4455')).toBe('+5491122334455');
  });
  it('rechaza números incompletos', () => {
    expect(() => normalizarTelefonoAR('4123456')).toThrow();
  });
});
