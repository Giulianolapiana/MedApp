import { useState, useEffect } from "react";
import { fetchApi } from "../../../lib/api";
import type { EspecialidadRow } from "../../../types/database.types";

export function useEspecialidades() {
  const [especialidades, setEspecialidades] = useState<EspecialidadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEspecialidades();
  }, []);

  const fetchEspecialidades = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchApi<EspecialidadRow[]>("/especialidades/admin");
      setEspecialidades(data || []);
    } catch (err: any) {
      console.error("Error al cargar especialidades:", err);
      setError(err.message || "Error al cargar especialidades");
    } finally {
      setLoading(false);
    }
  };

  const createEspecialidad = async (nombre: string) => {
    try {
      setError(null);
      await fetchApi("/especialidades", {
        method: "POST",
        body: JSON.stringify({ nombre }),
      });
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
      await fetchApi(`/especialidades/${id}`, {
        method: "DELETE",
      });
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
