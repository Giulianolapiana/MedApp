import { supabase } from './supabase';

export const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('Falta variable de entorno: VITE_API_URL');
}

/**
 * Función genérica para hacer peticiones al backend.
 * Automáticamente obtiene y adjunta el token JWT de la sesión actual de Supabase Auth.
 */
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Error en la petición');
  }

  return data.data || data; // El backend envuelve en { data: ... } o responde directo
}
