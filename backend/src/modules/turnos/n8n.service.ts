import { ENV } from "../../core/config.js";

interface N8NWebhookPayload {
  accion: "CREAR" | "ACTUALIZAR" | "CANCELAR";
  turno_id: string;
  paciente: string;
  fecha: string;
  hora: string;
  inicio_utc: string;
  estado: string;
  medico_email: string | null;
  google_event_id: string | null;
  telefono: string;
  paciente_email: string | null;
  /** Fecha y hora legibles en la zona del consultorio, para correo y WhatsApp (A-01). */
  cuando: string;
  motivo: string;
  profesional: {
    nombre: string;
    especialidad: string;
  };
  record: {
    fecha_hora_inicio: string;
  };
}

export class N8NService {
  async notificar(payload: N8NWebhookPayload): Promise<string | null> {
    if (!ENV.N8N_WEBHOOK_URL) {
      console.log("N8N_WEBHOOK_URL no configurado, saltando notificación n8n.");
      return null;
    }

    try {
      const response = await fetch(ENV.N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ENV.N8N_API_KEY,
        },
        body: JSON.stringify(payload),
        // Si n8n o Google tardan, la reserva del paciente no queda esperando
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        console.error(`Error al notificar a n8n: ${response.statusText}`);
        return null;
      }

      const text = await response.text();
      try {
        const json = JSON.parse(text);
        if (json.google_event_id) {
          return json.google_event_id;
        }
      } catch (e) {
        // Ignorar error de parseo si no responde JSON
      }
      return null;
    } catch (error) {
      console.error("Error de red al notificar a n8n:", error);
      return null;
    }
  }
}

export const n8nService = new N8NService();
