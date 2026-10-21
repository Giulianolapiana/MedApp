import { lazy, Suspense, useState } from 'react';
import { CalendarCheck, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { abrirBusqueda } from '../../lib/busqueda';
import type { SlotSeleccionado } from './three/SlotWeekScene';

// three.js se descarga aparte: el texto y los botones pintan primero.
const HeroScene = lazy(() => import('./three/HeroScene'));

export function Hero() {
  const [slot, setSlot] = useState<SlotSeleccionado | null>(null);

  return (
    <section className="relative overflow-hidden bg-brand-900 text-white">
      {/* Luz de fondo detrás de la grilla 3D */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 70% at 78% 45%, rgb(18 158 138 / 0.28), transparent 70%), radial-gradient(40% 50% at 10% 100%, rgb(244 183 64 / 0.08), transparent 70%)',
        }}
      />

      <div className="container relative mx-auto grid items-center gap-6 px-4 pt-32 pb-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-4 lg:pt-36 lg:pb-16">
        <div className="max-w-xl">
          <h1 className="font-display text-[2.6rem] leading-[1.02] font-bold sm:text-6xl lg:text-[4.25rem]">
            Sacá turno sin llamar al consultorio.
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-brand-100">
            Elegí especialidad, profesional y un horario libre. Te mandamos la confirmación por correo y un
            recordatorio por WhatsApp el día anterior.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/reserva"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-signal px-7 py-4 text-lg font-bold text-brand-950 shadow-[0_10px_30px_-10px_rgb(244_183_64/0.7)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <CalendarCheck size={20} aria-hidden="true" />
              Sacar turno
            </Link>
            <button
              type="button"
              onClick={abrirBusqueda}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-4 text-base font-medium text-white transition-colors hover:border-white/50 hover:bg-white/5"
            >
              <Search size={18} aria-hidden="true" />
              Buscar médico o especialidad
            </button>
          </div>
        </div>

        <div>
          <div
            className="relative h-[300px] sm:h-[400px] lg:h-[500px]"
            role="img"
            aria-label="Semana de ejemplo con horarios libres, ocupados y tu turno resaltado"
          >
            <Suspense fallback={null}>
              <HeroScene onSelect={setSlot} />
            </Suspense>
          </div>

          <p aria-live="polite" className="mt-2 text-sm text-brand-200 lg:text-right">
            {slot
              ? `Elegiste el ${slot.dia} a las ${slot.hora}. En la reserva ves los horarios reales.`
              : 'Semana de ejemplo: tocá un horario libre.'}
          </p>
        </div>
      </div>
    </section>
  );
}
