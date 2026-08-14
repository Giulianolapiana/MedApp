import { useState } from "react";
import { Plus, Edit2, Loader2, UserRound } from "lucide-react";
import { useProfesionales, type Profesional, type ProfesionalInsert } from "../hooks/useProfesionales";
import { useEspecialidades } from "../hooks/useEspecialidades";
import type { EspecialidadRow } from "../../../types/database.types";

export function ProfesionalesTab() {
  const { profesionales, loading: loadingProf, error: errorProf, createProfesional, updateProfesional } = useProfesionales();
  const { especialidades, loading: loadingEsp, error: errorEsp } = useEspecialidades();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<Profesional | null>(null);

  const handleOpenNew = () => {
    setEditingProf(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prof: Profesional) => {
    setEditingProf(prof);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Partial<ProfesionalInsert>) => {
    if (editingProf) {
      await updateProfesional(editingProf.id, data);
    } else {
      await createProfesional(data as Omit<ProfesionalInsert, "clinica_id">);
    }
    setIsModalOpen(false);
  };

  if (loadingProf || loadingEsp) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E53935]" />
        <span className="ml-3 text-gray-500">Cargando datos...</span>
      </div>
    );
  }

  if (errorProf || errorEsp) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
          <strong>Error:</strong> {errorProf || errorEsp}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-white/5 p-6 bg-[#1a1a1a]">
        <div>
          <h2 className="text-lg font-bold font-[var(--font-display)] text-white">Staff Médico</h2>
          <p className="text-sm text-gray-500">Gestioná los profesionales de tu clínica.</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="flex items-center gap-2 rounded-lg bg-[#E53935] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#E53935]/20 hover:bg-[#EF5350] transition-colors"
        >
          <Plus size={16} />
          Nuevo
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {profesionales.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-500">
            <p>No hay profesionales registrados.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {profesionales.map((prof) => (
              <div key={prof.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#1a1a1a] p-4 hover:border-white/20 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-gray-400">
                    <UserRound size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{prof.nombre}</h3>
                    <p className="text-sm text-gray-500">{prof.especialidad}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenEdit(prof)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <ProfesionalModal 
          profesional={editingProf} 
          especialidades={especialidades}
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
}

function ProfesionalModal({ 
  profesional,
  especialidades,
  onClose, 
  onSave 
}: { 
  profesional: Profesional | null; 
  especialidades: EspecialidadRow[];
  onClose: () => void; 
  onSave: (data: Partial<ProfesionalInsert>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    nombre: profesional?.nombre || "",
    especialidad: profesional?.especialidad || "",
    activo: profesional?.activo ?? true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.especialidad) return;
    setLoading(true);
    await onSave(formData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121212] shadow-2xl overflow-hidden">
        <div className="border-b border-white/10 bg-[#1a1a1a] px-6 py-4">
          <h2 className="text-lg font-bold font-[var(--font-display)] text-white">
            {profesional ? "Editar Profesional" : "Nuevo Profesional"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nombre Completo *</label>
            <input
              autoFocus
              required
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2 text-white focus:border-[#E53935] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Especialidad *</label>
            {especialidades.length === 0 ? (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-500">
                Debes crear una especialidad en la pestaña "Especialidades" antes de poder agregar un profesional.
              </div>
            ) : (
              <select
                required
                value={formData.especialidad}
                onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2 text-white focus:border-[#E53935] focus:outline-none appearance-none"
              >
                <option value="" disabled>
                  Seleccione una especialidad
                </option>
                {especialidades.map((esp) => (
                  <option key={esp.id} value={esp.nombre}>
                    {esp.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-[#E53935] focus:ring-[#E53935] focus:ring-offset-gray-900"
            />
            <label htmlFor="activo" className="text-sm font-medium text-gray-300">
              Profesional Activo
            </label>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
              Cancelar
            </button>
            <button type="submit" disabled={loading || especialidades.length === 0} className="rounded-lg bg-[#E53935] px-6 py-2 text-sm font-medium text-white hover:bg-[#EF5350] disabled:opacity-50">
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
