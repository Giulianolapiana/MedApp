import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import type { EspecialidadRow } from "../../../types/database.types";

export function useEspecialidades() {
  const [especialidades, setEspecialidades] = useState<EspecialidadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clinicaId, setClinicaId] = useState<string | null>(null);

  useEffect(() => {
    fetchEspecialidades();
  }, []);

  const fetchEspecialidades = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No autenticado");

      const { data: adminData } = await supabase
        .from("usuarios_administrativos")
        .select("clinica_id")
        .eq("id", userData.user.id)
        .single();
        
      if (!adminData) throw new Error("Error al obtener clínica");
      
      setClinicaId(adminData.clinica_id);

      const { data, error: err } = await supabase
        .from("especialidades")
        .select("*")
        .eq("clinica_id", adminData.clinica_id)
        .order("nombre");

      if (err) throw err;
      setEspecialidades(data || []);
    } catch (err: any) {
      console.error("Error al cargar especialidades:", err);
      setError(err.message || "Error al cargar especialidades");
    } finally {
      setLoading(false);
    }
  };

  const createEspecialidad = async (nombre: string) => {
    if (!clinicaId) return;
    try {
      setError(null);
      const { error: err } = await supabase.from("especialidades").insert([
        {
          clinica_id: clinicaId,
          nombre,
        },
      ]);

      if (err) {
        if (err.code === "23505") { // Unique violation
            throw new Error("Ya existe una especialidad con ese nombre");
        }
        throw err;
      }
      await fetchEspecialidades();
    } catch (err: any) {
      console.error("Error al crear especialidad:", err);
      setError(err.message || "Error al crear especialidad");
      throw err; // Re-throw to be handled by UI
    }
  };

  const deleteEspecialidad = async (id: string) => {
    try {
      setError(null);
      const { error: err } = await supabase.from("especialidades").delete().eq("id", id);
      if (err) throw err;
      setEspecialidades(especialidades.filter((e) => e.id !== id));
    } catch (err: any) {
      console.error("Error al eliminar especialidad:", err);
      setError(err.message || "Error al eliminar especialidad");
    }
  };

  return {
    especialidades,
    loading,
    error,
    createEspecialidad,
    deleteEspecialidad,
    refresh: fetchEspecialidades,
  };
}
