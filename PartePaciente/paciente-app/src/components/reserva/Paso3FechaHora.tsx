import { useState, useEffect } from 'react';
import { useReserva } from '../../context/ReservaContext';
import { getDisponibilidadDia, getDiasDisponibles } from '../../services/turnos.service';
import type { Slot } from '../../types';
import { format, addDays, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';

export function Paso3FechaHora() {
  const { state, setFecha, setSlotHora, setPasoActual } = useReserva();
  
  // Generar próximos 14 días (para tener más chance de mostrar días habilitados)
  const hoy = startOfToday();
  const proximosDias = Array.from({ length: 14 }).map((_, i) => addDays(hoy, i));
  
  const [fechaLocal, setFechaLocal] = useState<Date | null>(state.fecha || null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState<string | null>(state.slotHora || null);
  const [loading, setLoading] = useState(false);
  const [diasHabilitados, setDiasHabilitados] = useState<Set<number>>(new Set());
  const [loadingDias, setLoadingDias] = useState(true);

  // Cargar qué días atiende el médico
  useEffect(() => {
    if (state.medico) {
      setLoadingDias(true);
      getDiasDisponibles(state.medico.id).then(dias => {
        setDiasHabilitados(new Set(dias));
        setLoadingDias(false);
      });
    }
  }, [state.medico]);

  // Cargar slots cuando se selecciona una fecha
  useEffect(() => {
    if (fechaLocal && state.medico) {
      setLoading(true);
      getDisponibilidadDia(fechaLocal, state.medico.id).then(data => {
        setSlots(data);
        setLoading(false);
      });
    } else {
      setSlots([]);
    }
  }, [fechaLocal, state.medico]);

  // Filtrar sólo slots disponibles (no mostrar los ocupados/pasados)
  const slotsVisibles = slots.filter(s => s.disponible);

  const handleConfirmar = () => {
    if (fechaLocal && slotSeleccionado) {
      setFecha(fechaLocal);
      setSlotHora(slotSeleccionado);
      setPasoActual(4);
    }
  };

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="mb-6">
        <h3 className="font-semibold text-text-primary mb-3">1. Elegí un día</h3>
        {loadingDias ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div>
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {proximosDias.map(dia => {
              const isSelected = fechaLocal?.getTime() === dia.getTime();
              const diaSemana = dia.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab
              const noAtiende = !diasHabilitados.has(diaSemana);
              
              return (
                <button
                  key={dia.toISOString()}
                  onClick={() => {
                    if (!noAtiende) {
                      setFechaLocal(dia);
                      setSlotSeleccionado(null);
                    }
                  }}
                  disabled={noAtiende}
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl border transition-all ${
                    isSelected 
                      ? 'border-brand-500 bg-brand-600 text-white shadow-md' 
                      : noAtiende 
                        ? 'border-border-soft bg-slate-50 text-text-muted cursor-not-allowed opacity-40'
                        : 'border-border-soft bg-white hover:border-brand-300 hover:bg-brand-50 text-text-secondary'
                  }`}
                >
                  <span className="text-xs uppercase font-semibold opacity-80">
                    {format(dia, 'EEE', { locale: es })}
                  </span>
                  <span className="text-xl font-bold mt-1">
                    {format(dia, 'd')}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-text-primary mb-3">
          2. Elegí el horario {fechaLocal && `para el ${format(fechaLocal, 'dd/MM', { locale: es })}`}
        </h3>
        
        {!fechaLocal ? (
          <div className="p-8 text-center text-text-muted bg-bg-base rounded-xl border border-dashed border-border-soft">
            Seleccioná un día arriba para ver los horarios
          </div>
        ) : loading ? (
          <div className="p-8 flex flex-col items-center justify-center text-brand-600 bg-bg-base rounded-xl border border-dashed border-border-soft">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mb-4"></div>
            <p className="font-medium text-sm">Cargando disponibilidad...</p>
          </div>
        ) : slotsVisibles.length === 0 ? (
          <div className="p-8 text-center text-text-muted bg-bg-base rounded-xl border border-dashed border-border-soft">
            No hay turnos disponibles para este día. Probá con otro día.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {slotsVisibles.map((slot) => {
              const isSelected = slotSeleccionado === slot.hora;
              
              return (
                <button
                  key={slot.hora}
                  onClick={() => setSlotSeleccionado(slot.hora)}
                  className={`py-3 px-2 rounded-xl font-medium text-sm transition-all border ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-600 shadow-md ring-2 ring-brand-200 ring-offset-1'
                      : 'bg-white text-text-primary border-border-soft hover:border-brand-300 hover:bg-brand-50'
                  }`}
                >
                  {slot.hora}
                </button>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="mt-8 pt-4 border-t border-border-soft flex justify-end">
        <button
          disabled={!fechaLocal || !slotSeleccionado}
          onClick={handleConfirmar}
          className="bg-brand-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
