import { useState, useEffect } from "react";
import { fetchApi } from "../../../lib/api";
import type { Database } from "../../../types/database.types";

export type Paciente = Database["public"]["Tables"]["pacientes"]["Row"];
export type PacienteInsert = Database["public"]["Tables"]["pacientes"]["Insert"];

export function usePacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPacientes();
  }, []);

  async function fetchPacientes() {
    try {
      setLoading(true);
      const data = await fetchApi<Paciente[]>("/pacientes");
      setPacientes(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createPaciente(paciente: Omit<PacienteInsert, "clinica_id">) {
    try {
      const data = await fetchApi<Paciente>("/pacientes", {
        method: "POST",
        body: JSON.stringify(paciente),
      });
      setPacientes((prev) => [...prev, data].sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo)));
      return data;
    } catch (err: any) {
      throw new Error(err.message || "Error al crear paciente");
    }
  }

  async function updatePaciente(id: string, updates: Partial<PacienteInsert>) {
    try {
      const data = await fetchApi<Paciente>(`/pacientes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      setPacientes((prev) => 
        prev.map((p) => p.id === id ? data : p)
      );
      return data;
    } catch (err: any) {
      throw new Error(err.message || "Error al actualizar paciente");
    }
  }

  return { pacientes, loading, error, createPaciente, updatePaciente, fetchPacientes };
}
