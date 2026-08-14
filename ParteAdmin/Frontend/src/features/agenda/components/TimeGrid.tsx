import { startOfWeek, addDays, format, getDay, differenceInMinutes, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { Turno } from "../hooks/useAgenda";

interface TimeGridProps {
  currentDate: Date;
  turnos: Turno[];
}

const START_HOUR = 8; // 08:00 AM
const END_HOUR = 20; // 08:00 PM
const SLOT_DURATION_MINS = 30; // 30 mins base, configurable by doctor later

export function TimeGrid({ currentDate, turnos }: TimeGridProps) {
  // 1. Generate the 7 days of the week starting from Monday
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  // 2. Generate time slots for the Y-axis labels
  const totalSlots = ((END_HOUR - START_HOUR) * 60) / SLOT_DURATION_MINS;
  const timeLabels = Array.from({ length: totalSlots }).map((_, i) => {
    const hour = Math.floor(START_HOUR + (i * SLOT_DURATION_MINS) / 60);
    const minute = (i * SLOT_DURATION_MINS) % 60;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  });

  // 3. Helper to position a turno in the CSS Grid
  const getGridStyle = (turno: Turno) => {
    const start = parseISO(turno.fecha_hora_inicio);
    const end = turno.fecha_hora_fin ? parseISO(turno.fecha_hora_fin) : null;
    
    // Column: 1 for time label, 2 for Monday... 8 for Sunday
    // date-fns getDay: 0 is Sunday, 1 is Monday. We map Sunday to 7.
    let dayOfWeek = getDay(start);
    if (dayOfWeek === 0) dayOfWeek = 7;
    const gridColumn = dayOfWeek + 1; // +1 to skip the time labels column

    // Row start: calculated from 8:00 AM
    const minutesFromStart = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
    const rowStart = Math.floor(minutesFromStart / SLOT_DURATION_MINS) + 2; // +1 for header, +1 for 1-based CSS grid

    // Row span: duration / slotDuration
    let durationMins = SLOT_DURATION_MINS;
    if (end) {
      durationMins = differenceInMinutes(end, start);
    }
    const rowSpan = Math.max(1, Math.round(durationMins / SLOT_DURATION_MINS));

    return {
      gridColumn,
      gridRow: `${rowStart} / span ${rowSpan}`,
    };
  };

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case "pendiente": return "bg-amber-500/10 border-amber-500/20 text-amber-500";
      case "confirmado": return "bg-emerald-500/10 border-emerald-500/20 text-emerald-500";
      case "asistido": return "bg-teal-500/10 border-teal-500/20 text-teal-500";
      case "cancelado": return "bg-red-500/10 border-red-500/20 text-red-500";
      case "no_show": return "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-500";
      default: return "bg-blue-500/10 border-blue-500/20 text-blue-500";
    }
  };

  return (
    <div className="flex-1 overflow-auto rounded-xl border border-white/5 bg-[#121212] shadow-xl">
      <div 
        className="min-w-[800px] grid" 
        style={{ 
          // 8 columns: 1 time label (narrow), 7 days (equal width)
          gridTemplateColumns: "60px repeat(7, minmax(120px, 1fr))",
          // Rows: 1 header row + total time slots
          gridTemplateRows: `48px repeat(${totalSlots}, 40px)` 
        }}
      >
        
        {/* TOP HEADER: Days of the week */}
        <div className="sticky top-0 z-20 col-start-1 bg-[#1a1a1a] border-b border-white/5" />
        {days.map((day, i) => (
          <div 
            key={i} 
            className="sticky top-0 z-20 flex flex-col items-center justify-center bg-[#1a1a1a] border-b border-white/5 text-sm"
          >
            <span className="text-gray-400 capitalize">{format(day, "EEE", { locale: es })}</span>
            <span className="font-bold text-white">{format(day, "d")}</span>
          </div>
        ))}

        {/* Y-AXIS: Time Labels & Horizontal Grid Lines */}
        {timeLabels.map((time, i) => (
          // Use fragment to avoid breaking grid
          <div key={i} className="contents">
            {/* Time Label (Sticky on the left) */}
            <div 
              className="sticky left-0 z-10 flex items-start justify-end pr-2 pt-1 text-xs text-gray-500 bg-[#121212]"
              style={{ gridColumn: 1, gridRow: i + 2 }}
            >
              {/* Only show label for on-the-hour slots to reduce clutter */}
              {time.endsWith("00") ? time : ""}
            </div>
            
            {/* Grid Line spanning across all days */}
            <div 
              className="col-start-2 col-end-9 border-t border-white/5"
              style={{ gridRow: i + 2 }}
            />
          </div>
        ))}

        {/* TURNOS (Appointments) Rendered absolutely in their grid cells */}
        {turnos.map((turno) => (
          <div
            key={turno.id}
            style={getGridStyle(turno)}
            className={`z-10 m-0.5 p-2 rounded-lg border ${getBadgeColor(turno.estado)} flex flex-col overflow-hidden hover:opacity-80 transition-opacity cursor-pointer group`}
          >
            <span className="text-xs font-semibold truncate">
              {turno.pacientes?.nombre_completo || "Sin Nombre"}
            </span>
            <span className="text-[10px] opacity-70 truncate mt-1">
              {turno.profesionales?.nombre}
            </span>
            <span className="text-[10px] font-bold mt-auto hidden group-hover:block uppercase tracking-wider">
              {turno.estado}
            </span>
          </div>
        ))}

      </div>
    </div>
  );
}
