import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { Turno } from "../hooks/useAgenda";

interface EstadoTurnoModalProps {
  turno: Turno;
  onClose: () => void;
  onSave: (turnoId: string, estado: string, motivo?: string) => Promise<void>;
}

export function EstadoTurnoModal({ turno, onClose, onSave }: EstadoTurnoModalProps) {
  const [estado, setEstado] = useState(turno.estado);
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const requiresMotivo = estado === "cancelado";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (estado === turno.estado) {
      onClose();
      return;
    }

    if (requiresMotivo && !motivo.trim()) {
      setError("El motivo es obligatorio al cancelar un turno");
      return;
    }
    
    setSaving(true);
    setError("");
    
    try {
      await onSave(turno.id, estado, motivo || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al actualizar estado");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121212] shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#1a1a1a]">
          <h2 className="text-lg font-bold font-[var(--font-display)] text-white">
            Cambiar Estado del Turno
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-400">Paciente</p>
            <p className="font-medium text-white">{turno.pacientes?.nombre_completo || "Desconocido"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Profesional</p>
            <p className="font-medium text-white">{turno.profesionales?.nombre || "Desconocido"}</p>
          </div>

          <form id="estado-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
              <select
                value={estado}
                onChange={(e) => { setEstado(e.target.value); setError(""); }}
                className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2 text-white focus:border-[#E53935] focus:outline-none"
              >
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="asistido">Asistido</option>
                <option value="cancelado">Cancelado</option>
                <option value="no_show">No Show (Falta)</option>
              </select>
            </div>

            {requiresMotivo && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Motivo de cancelación <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => { setMotivo(e.target.value); setError(""); }}
                  placeholder="Ej: Paciente solicitó reprogramar"
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2 text-white placeholder:text-gray-600 focus:border-[#E53935] focus:outline-none resize-none"
                />
              </div>
            )}
          </form>
        </div>

        <div className="border-t border-white/10 p-4 bg-[#1a1a1a] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="estado-form"
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#E53935] px-6 py-2 text-sm font-medium text-white shadow-lg shadow-[#E53935]/20 hover:bg-[#EF5350] transition-colors disabled:opacity-50 min-w-[120px]"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
