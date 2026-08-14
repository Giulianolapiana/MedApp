import { useReserva } from '../../context/ReservaContext';
import { CheckCircle2, CalendarDays, UserRound, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export function Paso5Confirmacion() {
  const { state, resetReserva } = useReserva();

  return (
    <div className="p-8 md:p-12 text-center flex flex-col items-center justify-center h-full">
      <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6 animate-bounce">
        <CheckCircle2 size={40} strokeWidth={2.5} />
      </div>
      
      <h2 className="text-3xl font-display font-bold text-text-primary mb-4">
        ¡Turno reservado correctamente!
      </h2>
      <p className="text-text-secondary mb-8 max-w-md">
        Ya registramos tu turno. En unos minutos vas a recibir la confirmación por <strong>Email</strong> y <strong>WhatsApp</strong> con todos los detalles.
      </p>

      <div className="w-full max-w-md bg-bg-base border border-border-soft rounded-2xl p-6 text-left mb-8">
        <h3 className="font-semibold text-text-primary mb-4 border-b border-border-soft pb-3">
          Detalles de la reserva
        </h3>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <UserRound className="text-brand-500 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-medium text-text-primary">
                {state.paciente?.nombre} {state.paciente?.apellido}
              </p>
              <p className="text-xs text-text-secondary">{state.paciente?.email}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center mt-0.5">
              <div className="w-2 h-2 rounded-full bg-brand-600"></div>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{state.medico?.nombre}</p>
              <p className="text-xs text-brand-600 font-medium">{state.especialidad?.nombre}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CalendarDays className="text-brand-500 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-medium text-text-primary capitalize">
                {state.fecha && format(state.fecha, "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <p className="text-xs text-text-secondary">a las {state.slotHora} hs</p>
            </div>
          </div>
        </div>
      </div>

      <Link 
        to="/"
        onClick={resetReserva}
        className="inline-flex items-center text-brand-600 font-medium hover:text-brand-700 transition-colors"
      >
        Volver al inicio
        <ArrowRight size={18} className="ml-2" />
      </Link>
    </div>
  );
}
