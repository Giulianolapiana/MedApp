import { useEffect, useState } from "react";
import { fetchApi } from "../../../lib/api";
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

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    async function fetchData() {
      try {
        // 1. Obtener lista de profesionales de esta clínica
        const profs = await fetchApi<Profesional[]>("/profesionales/admin");
        if (mounted) setProfesionales(profs || []);

        // 2. Obtener turnos para la semana actual
        const inicio = startOfWeek(currentDate, { weekStartsOn: 1 }).toISOString();
        const fin = endOfWeek(currentDate, { weekStartsOn: 1 }).toISOString();

        let queryUrl = `/turnos?fecha_desde=${inicio}&fecha_hasta=${fin}`;
        
        if (selectedProfesionalId !== "ALL") {
          queryUrl += `&profesional_id=${selectedProfesionalId}`;
        }

        const turnosData = await fetchApi<Turno[]>(queryUrl);
        
        if (mounted) {
          setTurnos(turnosData || []);
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
    turno: Omit<Database["public"]["Tables"]["turnos"]["Insert"], "id" | "clinica_id">
  ) {
    try {
      const data = await fetchApi<Turno>("/turnos/admin", {
        method: "POST",
        body: JSON.stringify(turno),
      });
      // Trigger refresh
      setRefreshCounter((prev) => prev + 1);
      return data;
    } catch (error: any) {
      throw new Error(error.message || "Error al crear turno");
    }
  }

  async function updateTurnoStatus(turnoId: string, nuevoEstado: string, motivo?: string) {
    try {
      await fetchApi(`/turnos/${turnoId}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ nuevo_estado: nuevoEstado, motivo }),
      });
      setRefreshCounter((prev) => prev + 1);
    } catch (err: any) {
      throw new Error(err.message || "Error al actualizar estado del turno");
    }
  }

  return { turnos, profesionales, loading, error, createTurno, updateTurnoStatus };
}
