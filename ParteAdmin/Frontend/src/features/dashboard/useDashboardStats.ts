import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export interface DashboardStats {
  turnosHoy: number;
  ocupacion: number; // Porcentaje simulado por ahora
  pendientes: number;
  noShowsHoy: number;
  proximosTurnos: any[];
  loading: boolean;
  error: string | null;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    turnosHoy: 0,
    ocupacion: 0,
    pendientes: 0,
    noShowsHoy: 0,
    proximosTurnos: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      try {
        // Obtenemos la fecha de hoy en formato local (YYYY-MM-DD)
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfToday = new Date(today.setHours(23, 59, 59, 999)).toISOString();

        // 1. Turnos de hoy (cualquier estado, o quizás solo no cancelados)
        const { count: turnosHoyCount, error: err1 } = await supabase
          .from("turnos")
          .select("*", { count: "exact", head: true })
          .gte("fecha_hora_inicio", startOfToday)
          .lte("fecha_hora_inicio", endOfToday)
          .neq("estado", "cancelado");

        if (err1) throw err1;

        // 2. Pendientes globales (a confirmar)
        const { count: pendientesCount, error: err2 } = await supabase
          .from("turnos")
          .select("*", { count: "exact", head: true })
          .eq("estado", "pendiente");

        if (err2) throw err2;

        // 3. No-shows de hoy
        const { count: noShowsCount, error: err3 } = await supabase
          .from("turnos")
          .select("*", { count: "exact", head: true })
          .gte("fecha_hora_inicio", startOfToday)
          .lte("fecha_hora_inicio", endOfToday)
          .eq("estado", "no_show");

        if (err3) throw err3;

        // Cálculo de ocupación (mock por ahora hasta armar el motor de disponibilidad)
        const maxCapacity = 20; // 20 turnos diarios por clínica como base mock
        const validTurnos = turnosHoyCount || 0;
        const ocupacion = validTurnos > 0 ? Math.min(Math.round((validTurnos / maxCapacity) * 100), 100) : 0;

        // 4. Próximos turnos de hoy
        const { data: turnosList, error: err4 } = await supabase
          .from("turnos")
          .select(`
            id,
            fecha_hora_inicio,
            estado,
            pacientes ( nombre_completo ),
            profesionales ( nombre )
          `)
          .gte("fecha_hora_inicio", today.toISOString()) // Solo desde este momento en adelante
          .lte("fecha_hora_inicio", endOfToday)
          .order("fecha_hora_inicio", { ascending: true })
          .limit(5);

        if (err4) throw err4;

        if (mounted) {
          setStats({
            turnosHoy: validTurnos,
            ocupacion,
            pendientes: pendientesCount || 0,
            noShowsHoy: noShowsCount || 0,
            proximosTurnos: turnosList || [],
            loading: false,
            error: null,
          });
        }
      } catch (err: any) {
        console.error("Error fetching dashboard stats:", err);
        if (mounted) {
          setStats((prev) => ({
            ...prev,
            loading: false,
            error: err.message || "Error al cargar las métricas",
          }));
        }
      }
    }

    fetchStats();

    return () => {
      mounted = false;
    };
  }, []);

  return stats;
}
