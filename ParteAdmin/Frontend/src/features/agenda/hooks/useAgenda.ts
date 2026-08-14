import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { endOfWeek, startOfWeek } from "date-fns";
import type { Database } from "../../../types/database.types";

export type Turno = Database["public"]["Tables"]["turnos"]["Row"] & {
  pacientes: { nombre_completo: string | null } | null;
  profesionales: { nombre: string | null; id: string } | null;
};

export type Profesional = Database["public"]["Tables"]["profesionales"]["Row"];

export function useAgenda(currentDate: Date, selectedProfesionalId: string | "ALL") {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [clinicaIdRef, setClinicaIdRef] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    async function fetchData() {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) throw new Error("No autenticado");

        // 1. Obtener clinica_id del admin
        const { data: adminData, error: adminError } = await supabase
          .from("usuarios_administrativos")
          .select("clinica_id")
          .eq("id", userData.user.id)
          .single();

        if (adminError || !adminData) throw new Error("No se pudo obtener la clínica");
        const clinicaId = adminData.clinica_id;
        if (mounted) setClinicaIdRef(clinicaId);

        // 2. Obtener lista de profesionales de esta clínica
        const { data: profs, error: profsError } = await supabase
          .from("profesionales")
          .select("*")
          .eq("clinica_id", clinicaId);

        if (profsError) throw profsError;
        if (mounted) setProfesionales(profs || []);

        // 3. Obtener turnos para la semana actual
        // Para la vista semanal, necesitamos los turnos desde el lunes hasta el domingo de 'currentDate'
        const inicio = startOfWeek(currentDate, { weekStartsOn: 1 }).toISOString();
        const fin = endOfWeek(currentDate, { weekStartsOn: 1 }).toISOString();

        let query = supabase
          .from("turnos")
          .select(`
            *,
            pacientes ( nombre_completo ),
            profesionales ( id, nombre )
          `)
          .eq("clinica_id", clinicaId)
          .gte("fecha_hora_inicio", inicio)
          .lte("fecha_hora_inicio", fin);

        if (selectedProfesionalId !== "ALL") {
          query = query.eq("profesional_id", selectedProfesionalId);
        }

        const { data: turnosData, error: turnosError } = await query;
        if (turnosError) throw turnosError;

        if (mounted) {
          setTurnos((turnosData as unknown as Turno[]) || []);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || "Error al cargar la agenda");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [currentDate, selectedProfesionalId, refreshCounter]);

  async function createTurno(
    turno: Omit<Database["public"]["Tables"]["turnos"]["Insert"], "id" | "clinica_id"> & { clinica_id?: string }
  ) {
    if (!clinicaIdRef) throw new Error("Clínica ID no disponible");
    const payload = { ...turno, clinica_id: clinicaIdRef };
    
    const { data, error } = await supabase.from("turnos").insert([payload]).select().single();
    if (error) throw error;
    
    // Trigger refresh
    setRefreshCounter((prev) => prev + 1);
    return data;
  }

  return { turnos, profesionales, loading, error, createTurno };
}
