import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import type { Database } from "../../../types/database.types";

export type Disponibilidad = Database["public"]["Tables"]["disponibilidad"]["Row"];
export type DisponibilidadInsert = Database["public"]["Tables"]["disponibilidad"]["Insert"];

export function useDisponibilidad(profesionalId: string | null, clinicaId: string | null) {
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profesionalId && clinicaId) {
      fetchDisponibilidad();
    } else {
      setDisponibilidad([]);
    }
  }, [profesionalId, clinicaId]);

  async function fetchDisponibilidad() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("disponibilidad")
        .select("*")
        .eq("profesional_id", profesionalId!)
        .eq("clinica_id", clinicaId!)
        .order("dia_semana", { ascending: true });

      if (error) throw error;
      setDisponibilidad(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveDisponibilidad(updates: DisponibilidadInsert[]) {
    try {
      setLoading(true);
      // Supabase upsert requires primary keys or unique constraints.
      // Since it's easier, we can just delete existing for this professional and insert the new array,
      // or use upsert if we map the IDs correctly. Let's use upsert.
      const { data, error } = await supabase
        .from("disponibilidad")
        .upsert(updates)
        .select();
        
      if (error) throw error;
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
