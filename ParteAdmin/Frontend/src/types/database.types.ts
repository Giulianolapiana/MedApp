export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      backups_auditoria: {
        Row: {
          archivo_url: string | null
          clinica_id: string
          creado_en: string
          estado: string
          id: string
          tipo_artefacto: string
          tipo_ejecucion: string
        }
        Insert: {
          archivo_url?: string | null
          clinica_id: string
          creado_en?: string
          estado: string
          id?: string
          tipo_artefacto: string
          tipo_ejecucion: string
        }
        Update: {
          archivo_url?: string | null
          clinica_id?: string
          creado_en?: string
          estado?: string
          id?: string
          tipo_artefacto?: string
          tipo_ejecucion?: string
        }
        Relationships: [
          {
            foreignKeyName: "backups_auditoria_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      clinicas: {
        Row: {
          creado_en: string
          id: string
          nombre: string
          telefono: string | null
        }
        Insert: {
          creado_en?: string
          id?: string
          nombre: string
          telefono?: string | null
        }
        Update: {
          creado_en?: string
          id?: string
          nombre?: string
          telefono?: string | null
        }
        Relationships: []
      }
      disponibilidad: {
        Row: {
          clinica_id: string
          dia_semana: number
          habilitado: boolean
          horario_fin: string
          horario_inicio: string
          id: string
          profesional_id: string
        }
        Insert: {
          clinica_id: string
          dia_semana: number
          habilitado?: boolean
          horario_fin: string
          horario_inicio: string
          id?: string
          profesional_id: string
        }
        Update: {
          clinica_id?: string
          dia_semana?: number
          habilitado?: boolean
          horario_fin?: string
          horario_inicio?: string
          id?: string
          profesional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disponibilidad_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disponibilidad_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          },
        ]
      }
      especialidades: {
        Row: {
          clinica_id: string
          creado_en: string
          id: string
          nombre: string
        }
        Insert: {
          clinica_id: string
          creado_en?: string
          id?: string
          nombre: string
        }
        Update: {
          clinica_id?: string
          creado_en?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "especialidades_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      log_comunicacion: {
        Row: {
          canal: string
          clinica_id: string
          id: string
          respuesta_paciente: string | null
          timestamp: string
          tipo: Database["public"]["Enums"]["tipo_comunicacion"]
          turno_id: string
        }
        Insert: {
          canal?: string
          clinica_id: string
          id?: string
          respuesta_paciente?: string | null
          timestamp?: string
          tipo: Database["public"]["Enums"]["tipo_comunicacion"]
          turno_id: string
        }
        Update: {
          canal?: string
          clinica_id?: string
          id?: string
          respuesta_paciente?: string | null
          timestamp?: string
          tipo?: Database["public"]["Enums"]["tipo_comunicacion"]
          turno_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_comunicacion_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_comunicacion_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          activo: boolean
          clinica_id: string
          creado_en: string
          email: string | null
          fecha_nacimiento: string | null
          id: string
          nombre_completo: string
          telefono_whatsapp: string
        }
        Insert: {
          activo?: boolean
          clinica_id: string
          creado_en?: string
          email?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombre_completo: string
          telefono_whatsapp: string
        }
        Update: {
          activo?: boolean
          clinica_id?: string
          creado_en?: string
          email?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombre_completo?: string
          telefono_whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      profesionales: {
        Row: {
          activo: boolean
          clinica_id: string
          creado_en: string
          especialidad: string
          google_calendar_id: string | null
          id: string
          nombre: string
          usuario_id: string | null
        }
        Insert: {
          activo?: boolean
          clinica_id: string
          creado_en?: string
          especialidad: string
          google_calendar_id?: string | null
          id?: string
          nombre: string
          usuario_id?: string | null
        }
        Update: {
          activo?: boolean
          clinica_id?: string
          creado_en?: string
          especialidad?: string
          google_calendar_id?: string | null
          id?: string
          nombre?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profesionales_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profesionales_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios_administrativos"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos: {
        Row: {
          canal_reserva: Database["public"]["Enums"]["canal_reserva"]
          clinica_id: string
          creado_en: string
          estado: Database["public"]["Enums"]["estado_turno"]
          fecha_hora_fin: string | null
          fecha_hora_inicio: string
          google_event_id: string | null
          id: string
          paciente_id: string
          profesional_id: string
        }
        Insert: {
          canal_reserva?: Database["public"]["Enums"]["canal_reserva"]
          clinica_id: string
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_turno"]
          fecha_hora_fin?: string | null
          fecha_hora_inicio: string
          google_event_id?: string | null
          id?: string
          paciente_id: string
          profesional_id: string
        }
        Update: {
          canal_reserva?: Database["public"]["Enums"]["canal_reserva"]
          clinica_id?: string
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_turno"]
          fecha_hora_fin?: string | null
          fecha_hora_inicio?: string
          google_event_id?: string | null
          id?: string
          paciente_id?: string
          profesional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turnos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_administrativos: {
        Row: {
          clinica_id: string
          creado_en: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_usuario"]
        }
        Insert: {
          clinica_id: string
          creado_en?: string
          id: string
          nombre: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
        }
        Update: {
          clinica_id?: string
          creado_en?: string
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_administrativos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth_clinica_id: { Args: Record<string, never>; Returns: string }
      get_auth_profesional_id: { Args: Record<string, never>; Returns: string }
      get_auth_rol: {
        Args: Record<string, never>
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
    }
    Enums: {
      canal_reserva: "web" | "whatsapp" | "manual"
      estado_turno:
        | "pendiente"
        | "confirmado"
        | "cancelado"
        | "asistido"
        | "no_show"
      rol_usuario: "ADMINISTRADOR" | "RECEPCION" | "PROFESIONAL"
      tipo_comunicacion: "recordatorio" | "confirmacion" | "cancelacion"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ---------------------------------------------------------------------------
// Helper types for convenience across the app
// ---------------------------------------------------------------------------
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]

// Aliases semánticos para usar en toda la app
export type Clinica = Tables<"clinicas">
export type Paciente = Tables<"pacientes">
export type Profesional = Tables<"profesionales">
export type Turno = Tables<"turnos">
export type Disponibilidad = Tables<"disponibilidad">
export type LogComunicacion = Tables<"log_comunicacion">
export type UsuarioAdmin = Tables<"usuarios_administrativos">
export type BackupAuditoria = Tables<"backups_auditoria">
export type EspecialidadRow = Tables<"especialidades">

export type EstadoTurno = Enums<"estado_turno">
export type RolUsuario = Enums<"rol_usuario">
export type CanalReserva = Enums<"canal_reserva">
