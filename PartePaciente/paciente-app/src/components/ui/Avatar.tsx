import { iniciales } from '../../lib/texto';

/**
 * Avatar con iniciales generado localmente. Reemplaza a ui-avatars.com:
 * no manda el nombre del profesional a un servicio externo y no depende de la red.
 */
export function Avatar({ nombre, size = 56 }: { nombre: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-display font-bold text-brand-800 ring-2 ring-white"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {iniciales(nombre)}
    </span>
  );
}
