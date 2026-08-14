import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import type { Database } from "../../../types/database.types";

export type Profesional = Database["public"]["Tables"]["profesionales"]["Row"];
export type ProfesionalInsert = Database["public"]["Tables"]["profesionales"]["Insert"];

export function useProfesionales() {
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clinicaId, setClinicaId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfesionales();
  }, []);

  async function fetchProfesionales() {
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
        .from("profesionales")
        .select("*")
        .eq("clinica_id", adminData.clinica_id)
        .order("nombre", { ascending: true });

      if (error) throw error;
      setProfesionales(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createProfesional(profesional: Omit<ProfesionalInsert, "clinica_id">) {
    if (!clinicaId) throw new Error("Falta clinica_id");
    
    // Al no requerir usuario_id para iniciar sesión por ahora (MVP), lo dejamos en null
    // y solo guardamos nombre y especialidad.
    const { data, error } = await supabase
      .from("profesionales")
      .insert([{ ...profesional, clinica_id: clinicaId, usuario_id: null }])
      .select()
      .single();
      
    if (error) throw error;
    if (data) setProfesionales((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return data;
  }

  async function updateProfesional(id: string, updates: Partial<ProfesionalInsert>) {
    const { data, error } = await supabase
      .from("profesionales")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
      
    if (error) throw error;
    if (data) {
      setProfesionales((prev) => 
        prev.map((p) => p.id === id ? data : p)
      );
    }
    return data;
  }

  return { profesionales, loading, error, createProfesional, updateProfesional, fetchProfesionales, clinicaId };
}
