import { useState, useEffect } from 'react';
import { getMedicosByEspecialidad } from '../../services/medicos.service';
import type { Medico } from '../../types';
import { useReserva } from '../../context/ReservaContext';
import { Avatar } from '../ui/Avatar';

import { ArrowRight } from 'lucide-react';

export function Paso2Medico() {
  const { state, setMedico, setPasoActual } = useReserva();
  
  const [medicosFiltrados, setMedicosFiltrados] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state.especialidad) {
      getMedicosByEspecialidad(state.especialidad.nombre).then(data => {
        setMedicosFiltrados(data);
        setLoading(false);
      });
    }
  }, [state.especialidad]);

  const handleSelect = (medico: Medico) => {
    setMedico(medico);
    setPasoActual(3); // Avanza a fecha y hora
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-brand-600">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mb-4"></div>
        <p className="font-medium">Buscando profesionales...</p>
      </div>
    );
  }

  if (medicosFiltrados.length === 0) {
    return (
      <div className="p-12 text-center text-text-secondary">
        <p>No hay médicos disponibles para esta especialidad por el momento.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col gap-3.5">
        {medicosFiltrados.map((medico) => {
          return (
            <button
              key={medico.id}
              type="button"
              onClick={() => handleSelect(medico)}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border-soft bg-white p-4 sm:p-5 text-left transition-all hover:border-brand-400 hover:shadow-sm hover:bg-brand-50/30"
            >
              <div className="flex items-center gap-4 min-w-0">
                <Avatar nombre={medico.nombre} size={52} />
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-text-primary group-hover:text-brand-900 leading-snug">
                    {medico.nombre}
                  </h3>
                  <p className="text-sm font-medium text-brand-700">
                    {medico.especialidadNombre}
                  </p>
                </div>
              </div>
              <span className="inline-flex self-start sm:self-center shrink-0 items-center gap-1.5 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                Ver turnos
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
