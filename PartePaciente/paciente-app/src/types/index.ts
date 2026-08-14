export interface Especialidad {
  id: string;
  nombre: string;
  icon?: any;
}

export interface Medico {
  id: string;
  nombre: string;
  especialidadId: string;
  especialidadNombre: string;
  diasAtencion: string[];
  fotoUrl: string;
  bio: string;
}

export interface Slot {
  hora: string;
  disponible: boolean;
}

export interface DisponibilidadDia {
  fecha: Date;
  slots: Slot[];
}

export interface DatosPaciente {
  nombre: string;
  apellido: string;
  celular: string;
  email: string;
}
