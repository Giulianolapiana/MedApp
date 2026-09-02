import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import type { Profesional } from "../hooks/useAgenda";
import { useAuth } from "../../auth/AuthContext";

interface AgendaHeaderProps {
  currentDate: Date;
  onChangeDate: (date: Date) => void;
  profesionales: Profesional[];
  selectedProfesionalId: string;
  onChangeProfesional: (id: string) => void;
  onNewTurno: () => void;
}

export function AgendaHeader({
  currentDate,
  onChangeDate,
  profesionales,
  selectedProfesionalId,
  onChangeProfesional,
  onNewTurno,
}: AgendaHeaderProps) {
  // Format the month/year header (e.g. "Agosto 2026")
  const monthYear = format(currentDate, "MMMM yyyy", { locale: es });
  const { profile } = useAuth();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-5">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-white capitalize">
          {monthYear}
        </h1>

        <div className="flex items-center rounded-lg border border-white/10 bg-[#1a1a1a] p-1">
          <button
            onClick={() => onChangeDate(subWeeks(currentDate, 1))}
            className="rounded-md p-1.5 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => onChangeDate(new Date())}
            className="px-3 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={() => onChangeDate(addWeeks(currentDate, 1))}
            className="rounded-md p-1.5 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {profile?.rol !== "PROFESIONAL" && (
          <select
            value={selectedProfesionalId}
            onChange={(e) => onChangeProfesional(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#E53935] focus:outline-none focus:ring-1 focus:ring-[#E53935]"
          >
            <option value="ALL">Todos los profesionales</option>
            {profesionales.map((prof) => (
              <option key={prof.id} value={prof.id}>
                {prof.nombre}
              </option>
            ))}
          </select>
        )}

        {profile?.rol !== "PROFESIONAL" && (
          <button 
            onClick={onNewTurno}
            className="flex items-center gap-2 rounded-lg bg-[#E53935] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#E53935]/20 hover:bg-[#EF5350] transition-colors"
          >
            <Plus size={16} />
            Nuevo Turno
          </button>
        )}
      </div>
    </div>
  );
}
