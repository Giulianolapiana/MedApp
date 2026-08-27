import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { fetchApi } from "../../../lib/api";
import type { Database } from "../../../types/database.types";
import type { Profesional } from "../hooks/useAgenda";

type Paciente = Database["public"]["Tables"]["pacientes"]["Row"];

interface TurnoModalProps {
  onClose: () => void;
  onSave: (turnoData: any) => Promise<void>;
  profesionales: Profesional[];
  initialDate?: Date;
  initialProfesionalId?: string;
}

export function TurnoModal({ onClose, onSave, profesionales, initialDate, initialProfesionalId }: TurnoModalProps) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);
  
  const [formData, setFormData] = useState({
    paciente_id: "",
    profesional_id: initialProfesionalId === "ALL" || !initialProfesionalId ? "" : initialProfesionalId,
    fecha: initialDate ? initialDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    hora_inicio: "09:00",
    duracion_minutos: "30",
    estado: "pendiente" as "pendiente" | "confirmado",
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPacientes() {
      try {
        const data = await fetchApi<Paciente[]>("/pacientes");
        setPacientes(data || []);
      } catch (err) {
        console.error("Error fetching pacientes", err);
      } finally {
        setLoadingPacientes(false);
      }
    }
    fetchPacientes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.paciente_id || !formData.profesional_id || !formData.fecha || !formData.hora_inicio) {
      setError("Completá todos los campos obligatorios.");
      return;
    }
    
    setSaving(true);
    setError("");
    
    try {
      const inicio = new Date(`${formData.fecha}T${formData.hora_inicio}:00`);
      const fin = new Date(inicio.getTime() + parseInt(formData.duracion_minutos) * 60000);

      await onSave({
        paciente_id: formData.paciente_id,
        profesional_id: formData.profesional_id,
        fecha_hora_inicio: inicio.toISOString(),
        fecha_hora_fin: fin.toISOString(),
        estado: formData.estado,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al agendar turno");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121212] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#1a1a1a] shrink-0">
          <h2 className="text-lg font-bold font-[var(--font-display)] text-white">
            Nuevo Turno
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <form id="turno-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Paciente *</label>
              <select
                required
                disabled={loadingPacientes}
                value={formData.paciente_id}
                onChange={(e) => setFormData({ ...formData, paciente_id: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2 text-white focus:border-[#E53935] focus:outline-none"
              >
                <option value="" disabled>
                  {loadingPacientes ? "Cargando..." : "Seleccione un paciente"}
                </option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre_completo} ({p.telefono_whatsapp})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Profesional *</label>
              <select
                required
                value={formData.profesional_id}
                onChange={(e) => setFormData({ ...formData, profesional_id: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2 text-white focus:border-[#E53935] focus:outline-none"
              >
                <option value="" disabled>Seleccione un profesional</option>
                {profesionales.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre} ({p.especialidad})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Fecha *</label>
                <input
                  required
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2 text-white focus:border-[#E53935] focus:outline-none [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Hora Inicio *</label>
                <input
                  required
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2 text-white focus:border-[#E53935] focus:outline-none [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Duración (min) *</label>
                <select
                  required
                  value={formData.duracion_minutos}
                  onChange={(e) => setFormData({ ...formData, duracion_minutos: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2 text-white focus:border-[#E53935] focus:outline-none"
                >
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">1 hora</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Estado *</label>
                <select
                  required
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                  className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2 text-white focus:border-[#E53935] focus:outline-none"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        <div className="border-t border-white/10 p-4 bg-[#1a1a1a] shrink-0 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="turno-form"
            disabled={saving || loadingPacientes}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#E53935] px-6 py-2 text-sm font-medium text-white shadow-lg shadow-[#E53935]/20 hover:bg-[#EF5350] transition-colors disabled:opacity-50 min-w-[120px]"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : "Agendar"}
          </button>
        </div>
      </div>
    </div>
  );
}
