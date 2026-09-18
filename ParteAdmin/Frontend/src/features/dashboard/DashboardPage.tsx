import { LayoutDashboard, Clock, UserRound, ArrowRight, Loader2 } from "lucide-react";
import { useDashboardStats } from "./useDashboardStats";
import type { EstadoTurno } from "../../types/database.types";

import { useAuth } from "../../features/auth/AuthContext";
import { Navigate } from "react-router-dom";

export function DashboardPage() {
  const { profile } = useAuth();
  
  const stats = useDashboardStats();
  const { turnosHoy, ocupacion, pendientes, noShowsHoy, proximosTurnos, loading, error } = stats;

  if (profile?.rol === "PROFESIONAL") {
    return <Navigate to="/agenda" replace />;
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E53935]" />
        <p className="mt-4 text-sm text-gray-500">Cargando métricas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-500">
        <h3 className="font-bold">Error al cargar el dashboard</h3>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 border-b border-white/5 pb-5">
        <div className="rounded-lg bg-[#E53935]/10 p-2 border border-[#E53935]/20">
          <LayoutDashboard className="text-[#E53935]" size={24} />
        </div>
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-white">Dashboard</h1>
      </div>

      {/* KPI Widgets */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <KpiCard label="Turnos hoy" value={turnosHoy} />
        <KpiCard label="Pendientes" value={pendientes} />
        <KpiCard label="Confirmados" value={stats.confirmados ?? 0} />
        <KpiCard label="Cancelados" value={stats.cancelados ?? 0} isAlert={stats.tasaCancelacion > 20} />
        <KpiCard label="No-show hoy" value={noShowsHoy} isAlert={noShowsHoy > 0} />
        <KpiCard label="Asistencia" value={`${stats.tasaAsistencia ?? 0}%`} />
        <KpiCard label="Cancelación" value={`${stats.tasaCancelacion ?? 0}%`} />
        <KpiCard label="Ocupación" value={`${ocupacion}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Próximos Turnos */}
        <div className="col-span-2 rounded-2xl border border-white/5 bg-[#1a1a1a] shadow-lg">
          <div className="flex items-center justify-between border-b border-white/5 p-5">
            <h2 className="text-lg font-semibold text-white font-[var(--font-display)]">Próximos Turnos (Hoy)</h2>
            <button className="text-sm font-medium text-[#E53935] hover:text-[#EF5350] transition-colors flex items-center gap-1">
              Ver agenda <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="p-0">
            {proximosTurnos.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No hay más turnos programados para el resto del día.
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {proximosTurnos.map((turno: any) => (
                  <li key={turno.id} className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-400">
                        <UserRound size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {turno.pacientes?.nombre_completo || "Paciente desconocido"}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <span className="text-[#E53935]">{turno.profesionales?.nombre}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-300">
                        <Clock size={14} className="text-gray-500" />
                        {new Date(turno.fecha_hora_inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Mendoza' })}
                      </div>
                      <EstadoBadge estado={turno.estado} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Resumen o Actividad (Placeholder) */}
        <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] shadow-lg p-5">
          <h2 className="text-lg font-semibold text-white font-[var(--font-display)] mb-4">Actividad Reciente</h2>
          <div className="flex h-64 flex-col items-center justify-center text-center text-gray-500 border border-dashed border-white/10 rounded-xl">
            <p className="text-sm">El feed de actividad se activará cuando haya historial de reservas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Subcomponents ----

function KpiCard({ label, value, isAlert = false }: { label: string; value: string | number; isAlert?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-5 shadow-lg relative overflow-hidden group hover:border-white/10 transition-colors">
      {isAlert && (
        <div className="absolute top-0 right-0 w-2 h-full bg-[#EF5350]" />
      )}
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
        {label}
      </p>
      <p className={`text-3xl font-bold tracking-tight ${isAlert ? "text-[#EF5350]" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: EstadoTurno }) {
  const config: Record<EstadoTurno, { label: string; colorClass: string }> = {
    pendiente: { label: "Pendiente", colorClass: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    confirmado: { label: "Confirmado", colorClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    asistido: { label: "Asistido", colorClass: "bg-teal-500/10 text-teal-500 border-teal-500/20" },
    cancelado: { label: "Cancelado", colorClass: "bg-red-500/10 text-red-500 border-red-500/20" },
    no_show: { label: "No Show", colorClass: "bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20" },
  };

  const current = config[estado] || config.pendiente;

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${current.colorClass}`}>
      {current.label}
    </span>
  );
}
