import { useState, useEffect } from "react";
import { fetchApi } from "../../../lib/api";
import type { Database } from "../../../types/database.types";

export type Profesional = Database["public"]["Tables"]["profesionales"]["Row"];
export type ProfesionalInsert = Database["public"]["Tables"]["profesionales"]["Insert"];

export function useProfesionales() {
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfesionales();
  }, []);

  async function fetchProfesionales() {
    try {
      setLoading(true);
      const data = await fetchApi<Profesional[]>("/profesionales/admin");
      setProfesionales(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  type CreateProfesionalPayload = Omit<ProfesionalInsert, "clinica_id"> & { 
    crear_acceso?: boolean; 
    email_acceso?: string; 
    password_acceso?: string;
  };

  async function createProfesional(profesional: CreateProfesionalPayload) {
    try {
      const data = await fetchApi<Profesional>("/profesionales", {
        method: "POST",
        body: JSON.stringify(profesional),
      });
      setProfesionales((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      return data;
    } catch (err: any) {
      throw new Error(err.message || "Error al crear profesional");
    }
  }

  async function updateProfesional(id: string, updates: Partial<ProfesionalInsert>) {
    try {
      const data = await fetchApi<Profesional>(`/profesionales/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      setProfesionales((prev) => 
        prev.map((p) => p.id === id ? data : p)
      );
      return data;
    } catch (err: any) {
      throw new Error(err.message || "Error al actualizar profesional");
    }
  }

  return { profesionales, loading, error, createProfesional, updateProfesional, fetchProfesionales, clinicaId: "auto-resolved-by-backend" };
}
