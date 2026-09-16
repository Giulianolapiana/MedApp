import { useState } from 'react';
import { useReserva } from '../../context/ReservaContext';
import { crearTurno } from '../../services/turnos.service';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Paso4Datos() {
  const { state, setPaciente, setPasoActual } = useReserva();
  
  const [formData, setFormData] = useState({
    nombre: state.paciente?.nombre || '',
    apellido: state.paciente?.apellido || '',
    celular: state.paciente?.celular || '',
    email: state.paciente?.email || ''
  });
  
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaciente(formData);
    setErrorSubmit(null);
    setLoading(true);

    try {
      if (!state.medico || !state.fecha || !state.slotHora) {
        throw new Error("Faltan datos del turno");
      }

      await crearTurno(
        state.medico.id,
        state.fecha,
        state.slotHora,
        formData,
        aceptaPrivacidad
      );
      
      setPasoActual(5);
    } catch (err: any) {
      console.error("Error al crear turno:", err);
      setErrorSubmit(err.message || "Ocurrió un error al confirmar tu turno. Por favor, intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {errorSubmit && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
          {errorSubmit}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Nombre *</label>
            <input 
              type="text" 
              name="nombre"
              required
              value={formData.nombre}
              onChange={handleChange}
              className="w-full rounded-xl border border-border-soft px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              placeholder="Ej: Juan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Apellido *</label>
            <input 
              type="text" 
              name="apellido"
              required
              value={formData.apellido}
              onChange={handleChange}
              className="w-full rounded-xl border border-border-soft px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              placeholder="Ej: Pérez"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Celular *</label>
            <input 
              type="tel" 
              name="celular"
              required
              pattern="[0-9]{8,15}"
              value={formData.celular}
              onChange={handleChange}
              className="w-full rounded-xl border border-border-soft px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              placeholder="Ej: 1122334455 (sin 0 ni 15)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Email *</label>
            <input 
              type="email" 
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-border-soft px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              placeholder="Ej: juan@email.com"
            />
          </div>
        </div>
        
        <label className="flex items-start gap-3 mb-6 text-sm text-text-primary">
          <input
            type="checkbox"
            required
            checked={aceptaPrivacidad}
            onChange={(e) => setAceptaPrivacidad(e.target.checked)}
            className="mt-1 h-4 w-4 accent-brand-600"
          />
          <span>
            Acepto que el consultorio trate mis datos (nombre, teléfono y email) para gestionar mis turnos y
            enviarme recordatorios por WhatsApp y correo, según la{' '}
            <Link to="/privacidad" target="_blank" className="underline text-brand-600">política de privacidad</Link>
            {' '}(Ley 25.326). *
          </span>
        </label>

        <div className="mt-auto pt-6 border-t border-border-soft flex justify-end">
          <button
            type="submit"
            disabled={loading || !aceptaPrivacidad}
            className="flex items-center justify-center bg-brand-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-700 disabled:opacity-70 transition-colors w-full md:w-auto"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2" />
                Confirmando turno...
              </>
            ) : (
              'Confirmar turno'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
