import { TurnoType } from "./turnos.schemas";
import { ENV } from "../../core/config";

interface N8NWebhookPayload {
  accion: "CREAR" | "ACTUALIZAR" | "CANCELAR";
  paciente: string;
  fecha: string;
  hora: string;
  estado: string;
  medico_email: string | null;
  google_event_id: string | null;
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
        },
        body: JSON.stringify(payload),
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
