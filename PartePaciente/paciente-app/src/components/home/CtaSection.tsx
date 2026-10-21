import { Link } from 'react-router-dom';

export function CtaSection() {
  return (
    <section className="py-20 bg-bg-base relative overflow-hidden lg:py-24">
            <div className="container mx-auto px-4 relative z-10 text-center">
        <div className="max-w-3xl mx-auto bg-brand-900 rounded-[2rem] p-8 md:p-16 text-white">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
            Reservá en menos de dos minutos
          </h2>
          <p className="text-brand-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Sin crear cuenta. Solo necesitás tu nombre, celular y correo.
          </p>
          <Link 
            to="/reserva"
            className="inline-flex items-center justify-center bg-signal text-brand-950 px-8 py-4 rounded-full font-bold text-lg transition-transform hover:-translate-y-0.5"
          >
            Sacar turno
          </Link>
        </div>
      </div>
    </section>
  );
}
