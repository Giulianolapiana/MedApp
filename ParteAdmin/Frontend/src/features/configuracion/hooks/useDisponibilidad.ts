import { useState, useEffect } from "react";
import { fetchApi } from "../../../lib/api";
import type { Database } from "../../../types/database.types";

export type Disponibilidad = Database["public"]["Tables"]["disponibilidad"]["Row"];
export type DisponibilidadInsert = Database["public"]["Tables"]["disponibilidad"]["Insert"];

export function useDisponibilidad(profesionalId: string | null) {
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profesionalId) {
      fetchDisponibilidad();
    } else {
      setDisponibilidad([]);
    }
  }, [profesionalId]);

  async function fetchDisponibilidad() {
    try {
      setLoading(true);
      const data = await fetchApi<Disponibilidad[]>(`/disponibilidad/${profesionalId}`);
      setDisponibilidad(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveDisponibilidad(updates: Omit<DisponibilidadInsert, "clinica_id">[]) {
    try {
      setLoading(true);
      
      const cleanUpdates = updates.map(u => ({
        dia_semana: u.dia_semana,
        horario_inicio: u.horario_inicio.slice(0, 5),
        horario_fin: u.horario_fin.slice(0, 5),
        habilitado: u.habilitado
      }));

      const data = await fetchApi<Disponibilidad[]>(`/disponibilidad/${profesionalId}`, {
        method: "PUT",
        body: JSON.stringify({ items: cleanUpdates }),
      });
        
      setDisponibilidad(data || []);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { disponibilidad, loading, error, saveDisponibilidad };
}
