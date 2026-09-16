/**
 * Strategy Pattern para proveedores de pago.
 * Por ahora es un stub. Cuando se integre MercadoPago, se implementa
 * MercadoPagoProvider que cumple esta interfaz.
 */

export interface PagoResponse {
  preferenceId: string;
  initPoint: string; // URL para redirigir al usuario
}

export interface WebhookResult {
  externalReference: string;
  status: 'approved' | 'pending' | 'rejected';
}

export interface PagoStatus {
  status: 'approved' | 'pending' | 'rejected' | 'not_found';
}

export interface IPagosProvider {
  crearPago(turnoId: string, monto: number, description: string): Promise<PagoResponse>;
  procesarWebhook(body: unknown): Promise<WebhookResult>;
  consultarPago(externalReference: string): Promise<PagoStatus>;
}

export class MercadoPagoStubProvider implements IPagosProvider {
  async crearPago(): Promise<PagoResponse> {
    throw new Error('MercadoPago no configurado aún. Integración pendiente.');
  }

  async procesarWebhook(): Promise<WebhookResult> {
    throw new Error('MercadoPago no configurado aún. Integración pendiente.');
  }

  async consultarPago(): Promise<PagoStatus> {
    return { status: 'not_found' };
  }
}

// Singleton del provider activo
export const pagosProvider: IPagosProvider = new MercadoPagoStubProvider();
