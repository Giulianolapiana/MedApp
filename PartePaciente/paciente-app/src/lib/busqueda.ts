export const EVENTO_ABRIR_BUSQUEDA = 'medapp:abrir-busqueda';

/** Abre la paleta de búsqueda desde cualquier botón (lupa de la navbar, botón del hero). */
export function abrirBusqueda() {
  window.dispatchEvent(new Event(EVENTO_ABRIR_BUSQUEDA));
}

export const esMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
