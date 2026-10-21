import { Stethoscope, UserRound, CalendarClock, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    icon: Stethoscope,
    title: 'Elegí una especialidad',
    desc: 'Buscá en nuestra lista de especialidades médicas.'
  },
  {
    icon: UserRound,
    title: 'Seleccioná tu médico',
    desc: 'Conocé a los profesionales y sus horarios de atención.'
  },
  {
    icon: CalendarClock,
    title: 'Elegí fecha y horario',
    desc: 'Buscá el momento que mejor se adapte a tu agenda.'
  },
  {
    icon: CheckCircle2,
    title: 'Confirmá tus datos',
    desc: 'Completá tu información y recibí la confirmación.'
  }
];

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="scroll-mt-24 py-24 bg-white border-y border-border-soft relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4">
            Cómo sacar tu turno
          </h2>
          <p className="text-lg text-text-secondary">
            Cuatro pasos y el turno queda registrado en la agenda del consultorio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {STEPS.map((step, index) => (
            <div key={step.title} className="relative flex flex-col items-start text-left">
              {/* Connector line for desktop */}
              {index < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-8 left-20 right-4 h-[2px] bg-brand-100"></div>
              )}
              
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-brand-900 text-white flex items-center justify-center mb-6">
                <step.icon size={28} strokeWidth={2} aria-hidden="true" />
                <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-signal text-brand-950 border-[3px] border-white font-bold text-sm flex items-center justify-center">
                  {index + 1}
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-text-primary mb-2">{step.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
