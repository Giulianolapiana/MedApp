import { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Link } from 'react-router-dom';
import { fetchApi } from '../lib/api';
import { Stethoscope, Calendar, ArrowRight } from 'lucide-react';

interface Profesional {
  id: string;
  nombre: string;
  especialidad: string;
  activo: boolean;
}

export function MedicosPage() {
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<Profesional[]>('/profesionales')
      .then(data => {
        setProfesionales(data.filter(p => p.activo));
      })
      .catch(err => console.error('Error cargando profesionales:', err))
      .finally(() => setLoading(false));
  }, []);

  // Agrupar por especialidad
  const porEspecialidad = profesionales.reduce<Record<string, Profesional[]>>((acc, p) => {
    const key = p.especialidad;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div className="flex flex-col min-h-screen bg-bg-base">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-text-primary mb-3">
            Nuestro Equipo Médico
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Conocé a los profesionales de nuestra clínica y reservá tu turno directamente.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
          </div>
        ) : Object.keys(porEspecialidad).length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            No hay profesionales disponibles en este momento.
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(porEspecialidad).map(([especialidad, medicos]) => (
              <section key={especialidad}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-brand-100 p-2 rounded-lg text-brand-600">
                    <Stethoscope size={20} />
                  </div>
                  <h2 className="text-2xl font-display font-semibold text-text-primary">
                    {especialidad}
                  </h2>
                  <span className="text-sm text-text-muted bg-slate-100 px-3 py-1 rounded-full">
                    {medicos.length} profesional{medicos.length > 1 ? 'es' : ''}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {medicos.map(medico => (
                    <div key={medico.id} className="bg-white border border-border-soft rounded-2xl p-5 hover:shadow-md hover:border-brand-200 transition-all group">
                      <div className="flex items-center gap-4 mb-4">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(medico.nombre)}&background=E8F5E9&color=2E7D32&bold=true&size=64`}
                          alt={medico.nombre}
                          className="w-14 h-14 rounded-full border-2 border-brand-100"
                        />
                        <div>
                          <h3 className="font-semibold text-text-primary group-hover:text-brand-600 transition-colors">
                            {medico.nombre}
                          </h3>
                          <p className="text-sm text-brand-600 font-medium">{medico.especialidad}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-border-soft">
                        <div className="flex items-center gap-1.5 text-xs text-text-muted">
                          <Calendar size={14} />
                          <span>Turnos disponibles</span>
                        </div>
                        <Link
                          to="/reserva"
                          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                        >
                          Reservar
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
