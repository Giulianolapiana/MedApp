import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReserva } from '../../context/ReservaContext';
import { getEspecialidades } from '../../services/especialidades.service';
import type { Especialidad } from '../../types';
import { 
  Stethoscope, HeartPulse, Baby, Eye, Bone, Activity, Smile
} from 'lucide-react';

const getIconForEspecialidad = (nombre: string) => {
  const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const n = normalize(nombre);
  
  if (n.includes('cardiologia')) return HeartPulse;
  if (n.includes('dermatologia')) return Activity;
  if (n.includes('pediatria')) return Baby;
  if (n.includes('ginecologia')) return HeartPulse;
  if (n.includes('traumatologia')) return Bone;
  if (n.includes('oftalmologia')) return Eye;
  if (n.includes('odontologia')) return Smile;
  return Stethoscope;
};

export function EspecialidadesSection() {
  const { setEspecialidad, setPasoActual } = useReserva();
  const navigate = useNavigate();
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
    setPasoActual(2); // Directamente al paso 2 (médicos)
    navigate('/reserva');
  };

  return (
    <section id="especialidades" className="py-24 bg-bg-base">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4">
            Nuestras especialidades
          </h2>
          <p className="text-lg text-text-secondary">
            Contamos con un equipo de profesionales altamente capacitados en diversas áreas de la medicina.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {loading ? (
            <div className="col-span-full py-12 flex justify-center">
              <Activity className="animate-spin text-brand-600" size={32} />
            </div>
          ) : (
            especialidades.map((esp) => {
              const Icon = getIconForEspecialidad(esp.nombre);
              return (
                <button 
                  key={esp.id}
                  onClick={() => handleSelect(esp)}
                  className="group flex flex-col items-center p-6 bg-white rounded-2xl border border-border-soft hover:border-brand-300 hover:shadow-lg hover:shadow-brand-500/5 transition-all active:scale-95 cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                    <Icon size={32} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-medium text-text-primary text-center group-hover:text-brand-600 transition-colors">
                    {esp.nombre}
                  </h3>
                </button>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
