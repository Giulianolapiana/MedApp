import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

/**
 * Política de privacidad mínima (hallazgo A-02). Los campos entre corchetes
 * deben completarse con los datos del consultorio responsable antes de publicar.
 */
export function PrivacidadPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-base">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-3xl text-text-primary space-y-5 text-sm leading-relaxed">
        <h1 className="font-display text-3xl font-semibold">Política de privacidad</h1>
        <p><strong>Responsable del tratamiento:</strong> [NOMBRE DEL CONSULTORIO], [DOMICILIO], [EMAIL DE CONTACTO].</p>
        <h2 className="font-semibold text-lg">Qué datos tratamos y para qué</h2>
        <p>Nombre y apellido, teléfono celular y correo electrónico, junto con la fecha, hora y profesional del turno.
          Se usan únicamente para registrar, recordar, confirmar, cancelar o reprogramar tus turnos.
          No solicitamos síntomas, diagnósticos ni motivos de consulta por este medio.</p>
        <h2 className="font-semibold text-lg">Datos que pueden revelar información de salud</h2>
        <p>La especialidad del profesional con quien reservás puede considerarse un dato sensible (Ley 25.326, art. 2).
          Por eso su acceso se limita al personal autorizado del consultorio y no se comparte con fines distintos a la gestión del turno.</p>
        <h2 className="font-semibold text-lg">Proveedores y transferencia internacional</h2>
        <p>Para prestar el servicio se utilizan proveedores que pueden alojar datos fuera de la Argentina:
          [PROVEEDOR DE BASE DE DATOS Y REGIÓN], Google (calendario y hojas de respaldo), [PROVEEDOR DE WHATSAPP / CHATWOOT]
          y OpenAI (procesamiento de los mensajes del asistente virtual). Esta transferencia se realiza con el alcance
          previsto en el art. 12 de la Ley 25.326 y la Disposición DNPDP 60-E/2016.</p>
        <h2 className="font-semibold text-lg">Tus derechos</h2>
        <p>Podés solicitar el acceso, la rectificación o la supresión de tus datos escribiendo a [EMAIL DE CONTACTO].
          La Agencia de Acceso a la Información Pública es el órgano de control de la Ley 25.326.</p>
        <h2 className="font-semibold text-lg">Conservación</h2>
        <p>Los datos se conservan mientras seas paciente del consultorio y durante [PLAZO] posteriores.
          Los pacientes dados de baja se desactivan lógicamente para preservar el historial de turnos.</p>
      </main>
      <Footer />
    </div>
  );
}
