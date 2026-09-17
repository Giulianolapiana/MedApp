import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useReserva } from '../context/ReservaContext';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { Paso1Especialidad } from '../components/reserva/Paso1Especialidad';
import { Paso2Medico } from '../components/reserva/Paso2Medico';
import { Paso3FechaHora } from '../components/reserva/Paso3FechaHora';
import { Paso4Datos } from '../components/reserva/Paso4Datos';
import { Paso5Confirmacion } from '../components/reserva/Paso5Confirmacion';

export function ReservaPage() {
  const { state, setPasoActual } = useReserva();

  const renderStep = () => {
    switch (state.pasoActual) {
      case 1: return <Paso1Especialidad />;
      case 2: return <Paso2Medico />;
      case 3: return <Paso3FechaHora />;
      case 4: return <Paso4Datos />;
      case 5: return <Paso5Confirmacion />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-base">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {/* Header del Wizard */}
        <div className="mb-8">
          <button 
            onClick={() => {
              if (state.pasoActual > 1 && state.pasoActual < 5) {
                setPasoActual(state.pasoActual - 1);
              }
            }}
            className={`inline-flex items-center text-brand-600 hover:text-brand-700 font-medium mb-6 ${state.pasoActual === 1 || state.pasoActual === 5 ? 'invisible' : ''}`}
          >
            <ArrowLeft size={16} className="mr-1" />
            Volver
          </button>
          
          <h1 className="text-3xl font-display font-bold text-text-primary mb-6">
            {state.pasoActual === 1 && 'Seleccioná la especialidad'}
            {state.pasoActual === 2 && 'Elegí tu médico'}
            {state.pasoActual === 3 && 'Seleccioná fecha y hora'}
            {state.pasoActual === 4 && 'Confirmá tus datos'}
            {state.pasoActual === 5 && '¡Turno confirmado!'}
          </h1>

          {/* Progress Indicator */}
          {state.pasoActual < 5 && (
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border-soft -z-10 rounded-full"></div>
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-500 -z-10 rounded-full transition-all duration-300"
                style={{ width: `${((state.pasoActual - 1) / 3) * 100}%` }}
              ></div>
              
              {[1, 2, 3, 4].map(step => {
                const isActive = step === state.pasoActual;
                const isCompleted = step < state.pasoActual;
                return (
                  <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${isActive ? 'bg-brand-600 border-brand-600 text-white' : isCompleted ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-border-soft text-text-muted'}`}>
                    {isCompleted ? <CheckCircle2 size={16} /> : step}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Area */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-border-soft overflow-hidden min-h-[400px]">
            {renderStep()}
          </div>
          
          {/* Sidebar Summary (only if something is selected and before success) */}
          {state.pasoActual < 5 && (state.especialidad || state.medico || state.fecha) && (
            <div className="w-full lg:w-80 shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-border-soft p-6 sticky top-24">
                <h3 className="font-semibold text-lg text-text-primary mb-4 border-b border-border-soft pb-4">
                  Resumen de tu turno
                </h3>
                
                <div className="flex flex-col gap-4">
                  {state.especialidad && (
                    <div>
                      <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">Especialidad</span>
                      <p className="text-text-primary font-medium">{state.especialidad.nombre}</p>
                    </div>
                  )}
                  {state.medico && (
                    <div>
                      <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">Profesional</span>
                      <p className="text-text-primary font-medium">{state.medico.nombre}</p>
                    </div>
                  )}
                  {state.fecha && (
                    <div>
                      <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">Fecha y Hora</span>
                      <p className="text-text-primary font-medium">
                        {state.fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        {state.slotHora ? ` a las ${state.slotHora}hs` : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
