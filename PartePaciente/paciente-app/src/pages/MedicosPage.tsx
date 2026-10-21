import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Avatar } from '../components/ui/Avatar';
import { useReserva } from '../context/ReservaContext';
import { aMedico, getProfesionalesActivos, type ProfesionalApi } from '../services/medicos.service';
import { iconoEspecialidad } from '../lib/texto';

export function MedicosPage() {
  const [profesionales, setProfesionales] = useState<ProfesionalApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const { setEspecialidad, setMedico, setFecha, setSlotHora, setPasoActual } = useReserva();

  useEffect(() => {
    getProfesionalesActivos()
      .then(setProfesionales)
      .catch((err) => {
        console.error('Error cargando profesionales:', err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  // Agrupar por especialidad
  const porEspecialidad = profesionales.reduce<Record<string, ProfesionalApi[]>>((acc, p) => {
    (acc[p.especialidad] ??= []).push(p);
    return acc;
  }, {});

  // "Reservar" lleva directo a los horarios de ese profesional (paso 3).
  const reservar = (p: ProfesionalApi) => {
    setEspecialidad({ id: p.especialidad, nombre: p.especialidad });
    setMedico(aMedico(p));
    setFecha(null);
    setSlotHora(null);
    setPasoActual(3);
    navigate('/reserva');
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg-base">
      <Navbar />

      <main className="container mx-auto max-w-5xl flex-1 px-4 py-14">
        <div className="mb-12">
          <h1 className="font-display text-4xl font-bold text-text-primary md:text-5xl">Médicos</h1>
          <p className="mt-3 max-w-xl text-lg text-text-secondary">
            Profesionales que atienden en el consultorio. Tocá uno para ver sus horarios libres.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Cargando médicos">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/70" />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-3xl border border-dashed border-border-soft p-10 text-center text-text-secondary">
            No pudimos cargar el listado. Recargá la página o probá en unos minutos.
          </p>
        ) : Object.keys(porEspecialidad).length === 0 ? (
          <p className="py-16 text-center text-text-muted">No hay profesionales disponibles en este momento.</p>
        ) : (
          <div className="space-y-12">
            {Object.entries(porEspecialidad).map(([especialidad, medicos]) => {
              const Icon = iconoEspecialidad(especialidad);
              return (
                <section key={especialidad} aria-labelledby={`esp-${especialidad}`}>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="rounded-xl bg-brand-900 p-2 text-white">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <h2 id={`esp-${especialidad}`} className="font-display text-2xl font-semibold text-text-primary">
                      {especialidad}
                    </h2>
                    <span className="text-sm text-text-muted">
                      {medicos.length} profesional{medicos.length > 1 ? 'es' : ''}
                    </span>
                  </div>

                  <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {medicos.map((medico) => (
                      <li key={medico.id}>
                        <button
                          type="button"
                          onClick={() => reservar(medico)}
                          className="group flex w-full items-center gap-4 rounded-2xl border border-border-soft bg-white p-4 text-left transition-colors hover:border-brand-300"
                        >
                          <Avatar nombre={medico.nombre} size={52} />
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold text-text-primary leading-snug">{medico.nombre}</span>
                            <span className="block text-sm text-brand-700 group-hover:underline">Ver horarios libres</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
