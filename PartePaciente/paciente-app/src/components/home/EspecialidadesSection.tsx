import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useReserva } from '../../context/ReservaContext';
import { getEspecialidades } from '../../services/especialidades.service';
import { iconoEspecialidad } from '../../lib/texto';
import { TiltCard } from '../ui/TiltCard';
import type { Especialidad } from '../../types';

export function EspecialidadesSection() {
  const { setEspecialidad, setMedico, setPasoActual } = useReserva();
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
    setMedico(null);
    setPasoActual(2); // Directamente al paso 2 (médicos)
    navigate('/reserva');
  };

  return (
    <section id="especialidades" className="scroll-mt-24 bg-bg-base py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h2 className="font-display text-4xl font-bold text-text-primary md:text-5xl">Especialidades</h2>
          <p className="max-w-sm text-lg text-text-secondary">
            Elegí una y te mostramos los profesionales que atienden y sus horarios libres.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4" aria-busy="true" aria-label="Cargando especialidades">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-3xl bg-white/70" />
            ))}
          </div>
        ) : especialidades.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border-soft p-10 text-center text-text-secondary">
            No pudimos cargar las especialidades. Recargá la página o probá en unos minutos.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {especialidades.map((esp) => {
              const Icon = iconoEspecialidad(esp.nombre);
              return (
                <li key={esp.id}>
                  <TiltCard
                    onClick={() => handleSelect(esp)}
                    className="flex min-h-40 flex-col justify-between rounded-3xl border border-border-soft bg-surface p-5 text-left shadow-[0_1px_0_rgb(15_36_39/0.04)] hover:border-brand-300 hover:shadow-[0_24px_40px_-24px_rgb(11_59_66/0.45)] md:p-6"
                  >
                    <span
                      className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white"
                      style={{ transform: 'translateZ(36px)' }}
                    >
                      <Icon size={28} strokeWidth={1.6} aria-hidden="true" />
                    </span>
                    <span className="mt-6 flex items-end justify-between gap-2" style={{ transform: 'translateZ(18px)' }}>
                      <span className="font-display text-lg leading-tight font-semibold text-text-primary">{esp.nombre}</span>
                      <ArrowUpRight
                        size={20}
                        aria-hidden="true"
                        className="shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600"
                      />
                    </span>
                  </TiltCard>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
