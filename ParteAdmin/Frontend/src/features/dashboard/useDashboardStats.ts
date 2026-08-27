import { useEffect, useState } from "react";
import { fetchApi } from "../../lib/api";

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
        const data = await fetchApi<Omit<DashboardStats, "loading" | "error">>("/turnos/stats");
        
        if (mounted && data) {
          setStats({
            ...data,
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
