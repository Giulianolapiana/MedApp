import { Context, Next } from 'hono';
import { getConnInfo } from '@hono/node-server/conninfo';

/**
 * Límite de reservas públicas por dirección IP (A2-02).
 *
 * La IP se toma del encabezado X-Forwarded-For contando saltos desde la DERECHA:
 * el último valor lo agrega el proxy de confianza (Traefik, en Dokploy) y el
 * cliente no puede falsificarlo. Los valores de la izquierda los controla el
 * cliente y se ignoran. Sin proxy, se usa la dirección de la conexión.
 *
 * Complementos: las reservas por WhatsApp no pasan por este límite (usan clave
 * de servicio) y toda reserva web o por WhatsApp tiene además un límite por
 * teléfono calculado en la base de datos (turnos.service).
 * Almacenamiento en memoria: válido para una sola instancia de la API.
 */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = Number(process.env.RESERVAS_POR_HORA ?? 20);
const PROXIES_DE_CONFIANZA = Number(process.env.TRUSTED_PROXY_HOPS ?? 1);
const store = new Map<string, { count: number; timestamp: number }>();

export function ipDelCliente(xff: string | undefined, remota: string | undefined, saltos = PROXIES_DE_CONFIANZA): string {
  if (saltos > 0 && xff) {
    const ips = xff.split(',').map((s) => s.trim()).filter(Boolean);
    if (ips.length >= saltos) return ips[ips.length - saltos];
  }
  return remota ?? 'desconocida';
}

export function registrarIntento(clave: string, ahora = Date.now(), max = MAX_REQUESTS): boolean {
  const r = store.get(clave);
  if (!r || ahora - r.timestamp >= WINDOW_MS) {
    store.set(clave, { count: 1, timestamp: ahora });
  } else if (r.count >= max) {
    return false;
  } else {
    r.count++;
  }
  if (store.size > 10_000) {
    for (const [k, v] of store) if (ahora - v.timestamp >= WINDOW_MS) store.delete(k);
  }
  return true;
}

export const rateLimiterMiddleware = async (c: Context, next: Next) => {
  let remota: string | undefined;
  try { remota = getConnInfo(c).remote.address; } catch { remota = undefined; }
  const ip = ipDelCliente(c.req.header('x-forwarded-for'), remota);
  if (!registrarIntento(`ip:${ip}`)) {
    return c.json({ detail: 'Se alcanzó el límite de reservas. Intentá más tarde.', code: 'TOO_MANY_REQUESTS' }, 429);
  }
  await next();
};
