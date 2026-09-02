export const API_URL = import.meta.env.VITE_API_URL;
export const clinicaId = import.meta.env.VITE_CLINICA_ID;

if (!API_URL || !clinicaId) {
  throw new Error('Faltan variables de entorno: VITE_API_URL o VITE_CLINICA_ID');
}

/**
 * Función genérica para hacer peticiones al backend.
 * Incluye automáticamente el clinicaId en los query params si es un GET,
 * o en el body/query según corresponda, aunque para GET lo enviamos por URL.
 */
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = new URL(`${API_URL}${endpoint}`);
  
  // Añadir clinica_id a los query params automáticamente para todas las peticiones
  url.searchParams.append('clinica_id', clinicaId);
  console.log('>>> fetchApi url:', url.toString());

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Error en la petición');
  }

  return data.data; // El backend envuelve la respuesta en { data: ... }
}
