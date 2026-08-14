import { Link } from 'react-router-dom';

export function CtaSection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-brand-600/5"></div>
      <div className="container mx-auto px-4 relative z-10 text-center">
        <div className="max-w-3xl mx-auto bg-brand-600 rounded-3xl p-8 md:p-16 text-white shadow-2xl shadow-brand-600/30">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
            ¿Listo para cuidar tu salud?
          </h2>
          <p className="text-brand-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Reservá tu turno en menos de 2 minutos. Rápido, fácil y sin complicaciones.
          </p>
          <Link 
            to="/reserva"
            className="inline-flex items-center justify-center bg-white text-brand-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-50 transition-all active:scale-95 shadow-lg"
          >
            Sacar turno ahora
          </Link>
        </div>
      </div>
    </section>
  );
}
