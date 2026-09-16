/**
 * Normalización de teléfonos móviles argentinos a E.164 (+549XXXXXXXXXX).
 *
 * Necesaria para correlacionar al paciente entre canales (K-06): el turnero web
 * recibe "2614123456" y WhatsApp entrega "+5492614123456". Sin normalizar, la
 * misma persona quedaba como dos pacientes y no podía gestionar por WhatsApp
 * un turno reservado en la web.
 */
export function normalizarTelefonoAR(entrada: string): string {
  let d = (entrada ?? '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('54')) {
    d = d.slice(2);
    if (d.startsWith('9')) d = d.slice(1);
  }
  if (d.startsWith('0')) d = d.slice(1);           // prefijo interurbano
  // Quitar el "15" de celulares escritos a la antigua: 261 15 4123456
  const m = d.match(/^(\d{2,4})15(\d{6,8})$/);
  if (m && (m[1].length + m[2].length) === 10) d = m[1] + m[2];
  if (d.length !== 10) {
    throw new Error('Teléfono inválido: se espera código de área + número (10 dígitos)');
  }
  return `+549${d}`;
}
