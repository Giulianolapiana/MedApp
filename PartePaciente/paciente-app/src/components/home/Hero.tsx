import { CalendarCheck, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-900 pt-20 pb-28 text-white">
      {/* Background decoration with image and overlay */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop")' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/80 to-brand-800/60"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-800/50 border border-brand-700 text-brand-100 font-medium text-sm mb-6 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-brand-400"></span>
            Nuevo portal de pacientes
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] tracking-tight mb-6">
            Tu salud, en el momento que la <span className="text-brand-300">necesitás.</span>
          </h1>
          
          <p className="text-lg text-brand-100 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
            Sacá tu turno médico de forma rápida, simple y sin demoras. Elegí el profesional, el horario que mejor te quede y confirmá en segundos.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <Link 
              to="/reserva"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-brand-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-50 transition-all active:scale-95 shadow-lg shadow-black/20"
            >
              <CalendarCheck size={20} />
              Sacar turno ahora
            </Link>
            <a 
              href="#especialidades"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-brand-100 hover:text-white px-8 py-4 rounded-full font-medium text-lg transition-colors"
            >
              Ver especialidades
              <ChevronRight size={20} />
            </a>
          </div>
        </div>
        
        <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
          <div className="relative rounded-2xl bg-white/10 backdrop-blur-md shadow-2xl border border-white/20 p-2 overflow-hidden aspect-[4/3] lg:aspect-square flex items-center justify-center">
            <div className="relative z-10 w-3/4 h-3/4 bg-white rounded-xl shadow-lg border border-border-soft p-6 flex flex-col gap-4">
              <div className="h-6 w-1/3 bg-brand-100 rounded-md"></div>
              <div className="h-4 w-1/2 bg-slate-100 rounded-md"></div>
              <div className="flex gap-4 mt-4">
                <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-500"><CalendarCheck size={24}/></div>
                <div className="flex-1 flex flex-col gap-2 justify-center">
                  <div className="h-3 w-full bg-slate-100 rounded-full"></div>
                  <div className="h-3 w-2/3 bg-slate-100 rounded-full"></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-auto">
                <div className="h-10 rounded-lg bg-brand-50"></div>
                <div className="h-10 rounded-lg bg-brand-50"></div>
                <div className="h-10 rounded-lg bg-brand-600"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
