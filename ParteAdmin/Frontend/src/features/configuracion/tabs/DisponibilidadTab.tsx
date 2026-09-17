import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { useProfesionales } from "../hooks/useProfesionales";
import { useDisponibilidad, type DisponibilidadInsert } from "../hooks/useDisponibilidad";
import { useAuth } from "../../auth/AuthContext";

const DIAS = [
  { id: 1, nombre: "Lunes" },
  { id: 2, nombre: "Martes" },
  { id: 3, nombre: "Miércoles" },
  { id: 4, nombre: "Jueves" },
  { id: 5, nombre: "Viernes" },
  { id: 6, nombre: "Sábado" },
  { id: 0, nombre: "Domingo" },
];

export function DisponibilidadTab() {
  const { profesionales, clinicaId } = useProfesionales();
  const [selectedProfId, setSelectedProfId] = useState<string>("");

  const { disponibilidad, loading, error, saveDisponibilidad } = useDisponibilidad(selectedProfId);

  // Local state to manage edits before saving
  const [localDisp, setLocalDisp] = useState<Record<number, { habilitado: boolean; inicio: string; fin: string; id?: string }>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const { profile } = useAuth();
  const isProfesional = profile?.rol === "PROFESIONAL";

  useEffect(() => {
    if (isProfesional && profile?.profesional_id) {
      setSelectedProfId(profile.profesional_id);
    } else if (profesionales.length > 0 && !selectedProfId) {
      setSelectedProfId(profesionales[0].id);
    }
  }, [profesionales, selectedProfId, isProfesional, profile]);

  useEffect(() => {
    // Populate local state when DB state changes
    const newDisp: typeof localDisp = {};
    DIAS.forEach(dia => {
      const dbDay = disponibilidad.find(d => d.dia_semana === dia.id);
      newDisp[dia.id] = {
        habilitado: dbDay?.habilitado ?? false,
        inicio: dbDay?.horario_inicio?.substring(0, 5) ?? "09:00", // "09:00:00" -> "09:00"
        fin: dbDay?.horario_fin?.substring(0, 5) ?? "18:00",
        id: dbDay?.id,
      };
    });
    setLocalDisp(newDisp);
  }, [disponibilidad]);

  const handleSave = async () => {
    if (!clinicaId || !selectedProfId) return;
    setSaving(true);
    setSuccess(false);

    const updates: DisponibilidadInsert[] = DIAS.map(dia => {
      const current = localDisp[dia.id];
      return {
        ...(current.id ? { id: current.id } : {}),
        clinica_id: clinicaId,
        profesional_id: selectedProfId,
        dia_semana: dia.id,
        horario_inicio: current.inicio,
        horario_fin: current.fin,
        habilitado: current.habilitado,
      };
    });

    const success = await saveDisponibilidad(updates);
    if (success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-white/5 p-6 bg-[#1a1a1a]">
        <h2 className="text-lg font-bold font-[var(--font-display)] text-white">Disponibilidad Semanal</h2>
        <p className="text-sm text-gray-500 mb-4">Configurá los días y horarios de atención por profesional.</p>
        
        {/* Selector de profesional */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {isProfesional ? "Mi Profesional Asignado" : "Seleccionar Profesional"}
          </label>
          <select
            value={selectedProfId}
            onChange={(e) => setSelectedProfId(e.target.value)}
            disabled={isProfesional}
            className={`w-full max-w-sm rounded-lg border border-white/10 bg-[#121212] px-4 py-2 text-white focus:border-[#E53935] focus:outline-none ${
              isProfesional ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <option value="" disabled>Seleccione un profesional</option>
            {profesionales.map(p => (
              <option key={p.id} value={p.id}>{p.nombre} ({p.especialidad})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#E53935]" />
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl">
            {DIAS.map((dia) => {
              const current = localDisp[dia.id] || { habilitado: false, inicio: "09:00", fin: "18:00" };
              
              return (
                <div key={dia.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${current.habilitado ? "border-white/20 bg-white/[0.02]" : "border-white/5 bg-[#1a1a1a] opacity-60"}`}>
                  <div className="flex items-center gap-3 w-40">
                    <input
                      type="checkbox"
                      id={`dia-${dia.id}`}
                      checked={current.habilitado}
                      onChange={(e) => setLocalDisp(prev => ({ ...prev, [dia.id]: { ...prev[dia.id], habilitado: e.target.checked } }))}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-[#E53935] focus:ring-[#E53935] focus:ring-offset-gray-900"
                    />
                    <label htmlFor={`dia-${dia.id}`} className="font-medium text-white cursor-pointer">
                      {dia.nombre}
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">De</span>
                      <input
                        type="time"
                        disabled={!current.habilitado}
                        value={current.inicio}
                        onChange={(e) => setLocalDisp(prev => ({ ...prev, [dia.id]: { ...prev[dia.id], inicio: e.target.value } }))}
                        className="rounded-lg border border-white/10 bg-[#121212] px-3 py-1.5 text-sm text-white focus:border-[#E53935] focus:outline-none disabled:opacity-50 [color-scheme:dark]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">A</span>
                      <input
                        type="time"
                        disabled={!current.habilitado}
                        value={current.fin}
                        onChange={(e) => setLocalDisp(prev => ({ ...prev, [dia.id]: { ...prev[dia.id], fin: e.target.value } }))}
                        className="rounded-lg border border-white/10 bg-[#121212] px-3 py-1.5 text-sm text-white focus:border-[#E53935] focus:outline-none disabled:opacity-50 [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {success && (
          <div className="inline-flex items-center rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-500 border border-emerald-500/20">
            Horarios guardados correctamente.
          </div>
        )}
      </div>
      
      <div className="border-t border-white/5 bg-[#1a1a1a] p-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !selectedProfId || loading}
          className="flex items-center gap-2 rounded-lg bg-[#E53935] px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#E53935]/20 hover:bg-[#EF5350] transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
          {saving ? "Guardando..." : "Guardar Disponibilidad"}
        </button>
      </div>
    </div>
  );
}
