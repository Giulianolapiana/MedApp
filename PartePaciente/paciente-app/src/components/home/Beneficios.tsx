import { Clock, ShieldCheck, Zap, BellRing } from 'lucide-react';

const BENEFICIOS = [
  {
    icon: Clock,
    title: 'Turnos online 24/7',
    desc: 'No dependas de horarios de atención telefónica. Reservá cuando quieras.'
  },
  {
    icon: ShieldCheck,
    title: 'Atención profesional',
    desc: 'Los mejores especialistas a tu disposición para cuidar tu salud.'
  },
  {
    icon: Zap,
    title: 'Confirmación inmediata',
    desc: 'Tu turno queda registrado en el acto, sin tiempos de espera.'
  },
  {
    icon: BellRing,
    title: 'Recordatorios',
    desc: 'Te avisamos por WhatsApp para que no te olvides de tu cita.'
  }
];

export function Beneficios() {
  return (
    <section className="py-24 bg-bg-base">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {BENEFICIOS.map((b, i) => (
            <div key={i} className="flex gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-white border border-border-soft text-brand-600 flex items-center justify-center shadow-sm">
                <b.icon size={24} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">{b.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
