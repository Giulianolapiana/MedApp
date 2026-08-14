import { useState, useEffect } from 'react';
import { getMedicosByEspecialidad } from '../../services/medicos.service';
import type { Medico } from '../../types';
import { useReserva } from '../../context/ReservaContext';
import { Calendar } from 'lucide-react';

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {medicosFiltrados.map((medico) => {
          return (
            <div key={medico.id} className="flex flex-col bg-white border border-border-soft rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <img 
                  src={medico.fotoUrl} 
                  alt={medico.nombre} 
                  className="w-16 h-16 rounded-full object-cover shadow-sm bg-slate-100"
                />
                <div>
                  <h3 className="font-semibold text-lg text-text-primary">{medico.nombre}</h3>
                  <p className="text-sm text-brand-600 font-medium mb-1">{medico.especialidadNombre}</p>
                  <p className="text-xs text-text-secondary line-clamp-2">{medico.bio}</p>
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-border-soft flex items-center justify-between">
                <div className="flex items-center text-xs text-text-muted">
                  <Calendar size={14} className="mr-1" />
                  {medico.diasAtencion.join(', ')}
                </div>
                <button
                  onClick={() => handleSelect(medico)}
                  className="bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  Ver turnos
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
