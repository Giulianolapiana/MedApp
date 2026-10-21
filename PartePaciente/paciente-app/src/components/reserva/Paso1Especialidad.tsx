import { useState, useEffect } from 'react';
import { getEspecialidades } from '../../services/especialidades.service';
import type { Especialidad } from '../../types';
import { useReserva } from '../../context/ReservaContext';
import { Activity } from 'lucide-react';
import { iconoEspecialidad } from '../../lib/texto';

export function Paso1Especialidad() {
  const { state, setEspecialidad, setPasoActual } = useReserva();
  
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEspecialidades().then((data) => {
      setEspecialidades(data);
      setLoading(false);
    });
  }, []);

  const handleSelect = (esp: Especialidad) => {
    setEspecialidad(esp);
    setPasoActual(2);
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-brand-600">
        <Activity size={32} className="animate-spin mb-4" />
        <p className="font-medium">Cargando especialidades...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {especialidades.map((esp) => {
          const Icon = iconoEspecialidad(esp.nombre);
          const isSelected = state.especialidad?.id === esp.id;
          
          return (
            <button
              key={esp.id}
              onClick={() => handleSelect(esp)}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all ${
                isSelected 
                  ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm' 
                  : 'border-border-soft bg-white hover:border-brand-300 hover:bg-brand-50/50 hover:shadow-sm text-text-secondary'
              }`}
            >
              <Icon size={32} strokeWidth={1.5} className={isSelected ? 'text-brand-600 mb-3' : 'text-brand-400 mb-3'} />
              <span className="font-medium text-center">{esp.nombre}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
