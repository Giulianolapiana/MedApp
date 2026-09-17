import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Especialidad, Medico, DatosPaciente } from '../types';

interface ReservaState {
  pasoActual: number;
  especialidad: Especialidad | null;
  medico: Medico | null;
  fecha: Date | null;
  slotHora: string | null;
  paciente: DatosPaciente | null;
}

interface ReservaContextType {
  state: ReservaState;
  setPasoActual: (paso: number) => void;
  setEspecialidad: (esp: Especialidad | null) => void;
  setMedico: (medico: Medico | null) => void;
  setFecha: (fecha: Date | null) => void;
  setSlotHora: (hora: string | null) => void;
  setPaciente: (datos: DatosPaciente | null) => void;
  resetReserva: () => void;
}

const initialState: ReservaState = {
  pasoActual: 1,
  especialidad: null,
  medico: null,
  fecha: null,
  slotHora: null,
  paciente: null,
};

const ReservaContext = createContext<ReservaContextType | undefined>(undefined);

export function ReservaProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReservaState>(initialState);

  const setPasoActual = (pasoActual: number) => setState(prev => ({ ...prev, pasoActual }));
  const setEspecialidad = (especialidad: Especialidad | null) => setState(prev => ({ ...prev, especialidad }));
  const setMedico = (medico: Medico | null) => setState(prev => ({ ...prev, medico }));
  const setFecha = (fecha: Date | null) => setState(prev => ({ ...prev, fecha }));
  const setSlotHora = (slotHora: string | null) => setState(prev => ({ ...prev, slotHora }));
  const setPaciente = (paciente: DatosPaciente | null) => setState(prev => ({ ...prev, paciente }));
  const resetReserva = () => setState(initialState);

  return (
    <ReservaContext.Provider value={{
      state, setPasoActual, setEspecialidad, setMedico, setFecha, setSlotHora, setPaciente, resetReserva
    }}>
      {children}
    </ReservaContext.Provider>
  );
}

export function useReserva() {
  const context = useContext(ReservaContext);
  if (context === undefined) {
    throw new Error('useReserva debe ser usado dentro de un ReservaProvider');
  }
  return context;
}
