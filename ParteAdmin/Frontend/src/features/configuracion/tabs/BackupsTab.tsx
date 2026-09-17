import { useState, useEffect } from "react";
import { Loader2, ExternalLink, AlertCircle, CheckCircle2, Database, Sheet } from "lucide-react";
import { fetchApi } from "../../../lib/api";

// Respuesta de GET /api/v1/backups (el backend no expone rutas internas de archivos)
type BackupLog = {
  id: string;
  tipo_artefacto: "respaldo_bd" | "tablero_agenda" | string;
  tipo_ejecucion: string;
  estado: "completado" | "fallido" | string;
  archivo_url: string | null;
  tamano_bytes: number | null;
  detalle: string | null;
  creado_en: string;
};

const ETIQUETA: Record<string, string> = {
  respaldo_bd: "Respaldo de recuperación (base de datos)",
  tablero_agenda: "Tablero operativo de agenda (Google Sheets)",
};

function tamanoLegible(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function BackupsTab() {
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      setLoading(true);
      const data = await fetchApi<BackupLog[]>("/backups");
      setLogs(data || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar backups");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-white/5 p-6 bg-[#1a1a1a]">
        <h2 className="text-lg font-bold font-[var(--font-display)] text-white">Backups & Auditoría</h2>
        <p className="text-sm text-gray-500">
          Respaldo nocturno de la base de datos (servidor) y tablero de agenda de contingencia (n8n → Google Sheets).
          Los volcados de la base se restauran desde el servidor; no se descargan desde el panel porque contienen datos de toda la plataforma.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#E53935]" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
            <strong>Error:</strong> {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-500 space-y-3">
            <AlertCircle size={32} className="text-gray-600" />
            <p>No hay registros de backups todavía.</p>
            <p className="text-xs text-gray-600">Las ejecuciones automáticas aparecerán aquí.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/5 bg-[#1a1a1a] p-4 hover:border-white/10 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    log.estado === "completado" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                  }`}>
                    {log.estado === "completado" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  </div>
                  <div>
                    <h3 className="font-medium text-white flex items-center gap-2">
                      {log.tipo_artefacto === "respaldo_bd" ? <Database size={14} /> : <Sheet size={14} />}
                      {ETIQUETA[log.tipo_artefacto] ?? log.tipo_artefacto}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {new Date(log.creado_en).toLocaleString("es-AR", { timeZone: "America/Argentina/Mendoza" })}
                      {" · "}{log.tipo_ejecucion}
                      {tamanoLegible(log.tamano_bytes) ? ` · ${tamanoLegible(log.tamano_bytes)}` : ""}
                    </p>
                    {log.detalle && <p className="mt-1 text-xs text-gray-600">{log.detalle}</p>}
                  </div>
                </div>
                {log.tipo_artefacto === "tablero_agenda" && log.archivo_url && (
                  <a
                    href={log.archivo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <ExternalLink size={14} />
                    Abrir planilla
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
