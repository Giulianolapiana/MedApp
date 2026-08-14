import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import type { Database } from "../../../types/database.types";

export type Paciente = Database["public"]["Tables"]["pacientes"]["Row"];
export type PacienteInsert = Database["public"]["Tables"]["pacientes"]["Insert"];

export function usePacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clinicaId, setClinicaId] = useState<string | null>(null);

  useEffect(() => {
    fetchPacientes();
  }, []);

  async function fetchPacientes() {
    try {
      setLoading(true);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No autenticado");

      const { data: adminData } = await supabase
        .from("usuarios_administrativos")
        .select("clinica_id")
        .eq("id", userData.user.id)
        .single();
        
      if (!adminData) throw new Error("Error al obtener clínica");
      
      setClinicaId(adminData.clinica_id);

      const { data, error } = await supabase
        .from("pacientes")
        .select("*")
        .eq("clinica_id", adminData.clinica_id)
        .order("nombre_completo", { ascending: true });

      if (error) throw error;
      setPacientes(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createPaciente(paciente: Omit<PacienteInsert, "clinica_id">) {
    if (!clinicaId) throw new Error("Falta clinica_id");
    
    const { data, error } = await supabase
      .from("pacientes")
      .insert([{ ...paciente, clinica_id: clinicaId }])
      .select()
      .single();
      
    if (error) throw error;
    if (data) setPacientes((prev) => [...prev, data].sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo)));
    return data;
  }

  async function updatePaciente(id: string, updates: Partial<PacienteInsert>) {
    const { data, error } = await supabase
      .from("pacientes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
      
    if (error) throw error;
    if (data) {
      setPacientes((prev) => 
        prev.map((p) => p.id === id ? data : p)
      );
    }
    return data;
  }

  return { pacientes, loading, error, createPaciente, updatePaciente, fetchPacientes };
}
