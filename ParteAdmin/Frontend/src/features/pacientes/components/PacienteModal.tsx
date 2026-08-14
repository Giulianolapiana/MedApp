import { X } from "lucide-react";
import { useState } from "react";
import type { Paciente, PacienteInsert } from "../hooks/usePacientes";

interface PacienteModalProps {
  paciente?: Paciente | null;
  onClose: () => void;
  onSave: (paciente: Partial<PacienteInsert>) => Promise<void>;
}

export function PacienteModal({ paciente, onClose, onSave }: PacienteModalProps) {
  const [formData, setFormData] = useState<Partial<PacienteInsert>>({
    nombre_completo: paciente?.nombre_completo || "",
    telefono_whatsapp: paciente?.telefono_whatsapp || "",
    email: paciente?.email || "",
    fecha_nacimiento: paciente?.fecha_nacimiento || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre_completo || !formData.telefono_whatsapp) {
      setError("Nombre y teléfono son obligatorios.");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar paciente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121212] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#1a1a1a]">
          <h2 className="text-lg font-bold font-[var(--font-display)] text-white">
            {paciente ? "Editar Paciente" : "Nuevo Paciente"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nombre Completo *</label>
            <input
              autoFocus
              type="text"
              value={formData.nombre_completo}
              onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2 text-white placeholder-gray-500 focus:border-[#E53935] focus:outline-none focus:ring-1 focus:ring-[#E53935] transition-colors"
              placeholder="Ej. Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Teléfono (WhatsApp) *</label>
            <input
              type="text"
              value={formData.telefono_whatsapp}
              onChange={(e) => setFormData({ ...formData, telefono_whatsapp: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2 text-white placeholder-gray-500 focus:border-[#E53935] focus:outline-none focus:ring-1 focus:ring-[#E53935] transition-colors"
              placeholder="Ej. +54 9 11 1234 5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2 text-white placeholder-gray-500 focus:border-[#E53935] focus:outline-none focus:ring-1 focus:ring-[#E53935] transition-colors"
              placeholder="Ej. juan@correo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Fecha de Nacimiento</label>
            <input
              type="date"
              value={formData.fecha_nacimiento || ""}
              onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2 text-white placeholder-gray-500 focus:border-[#E53935] focus:outline-none focus:ring-1 focus:ring-[#E53935] transition-colors [color-scheme:dark]"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#E53935] px-6 py-2 text-sm font-medium text-white shadow-lg shadow-[#E53935]/20 hover:bg-[#EF5350] transition-colors disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar Paciente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
