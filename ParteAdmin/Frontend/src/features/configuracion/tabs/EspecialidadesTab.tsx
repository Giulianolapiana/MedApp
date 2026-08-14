import { useState } from "react";
import { Plus, Trash2, Loader2, BookOpen } from "lucide-react";
import { useEspecialidades } from "../hooks/useEspecialidades";

export function EspecialidadesTab() {
  const { especialidades, loading, error, createEspecialidad, deleteEspecialidad } = useEspecialidades();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenNew = () => {
    setIsModalOpen(true);
  };

  const handleSave = async (nombre: string) => {
    await createEspecialidad(nombre);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la especialidad "${nombre}"?`)) {
      await deleteEspecialidad(id);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E53935]" />
        <span className="ml-3 text-gray-500">Cargando especialidades...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-white/5 p-6 bg-[#1a1a1a]">
        <div>
          <h2 className="text-lg font-bold font-[var(--font-display)] text-white">Especialidades</h2>
          <p className="text-sm text-gray-500">Gestioná las especialidades médicas de tu clínica.</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="flex items-center gap-2 rounded-lg bg-[#E53935] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#E53935]/20 hover:bg-[#EF5350] transition-colors"
        >
          <Plus size={16} />
          Nueva
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {especialidades.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-500">
            <p>No hay especialidades registradas.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {especialidades.map((esp) => (
              <div key={esp.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#1a1a1a] p-4 hover:border-white/20 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-gray-400">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{esp.nombre}</h3>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(esp.id, esp.nombre)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  title="Eliminar especialidad"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <EspecialidadModal 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
}

function EspecialidadModal({ 
  onClose, 
  onSave 
}: { 
  onClose: () => void; 
  onSave: (nombre: string) => Promise<void>;
}) {
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await onSave(nombre.trim());
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121212] shadow-2xl overflow-hidden">
        <div className="border-b border-white/10 bg-[#1a1a1a] px-6 py-4">
          <h2 className="text-lg font-bold font-[var(--font-display)] text-white">
            Nueva Especialidad
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {errorMsg}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nombre de la Especialidad *</label>
            <input
              autoFocus
              required
              type="text"
              placeholder="Ej: Cardiología"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2 text-white focus:border-[#E53935] focus:outline-none"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !nombre.trim()} className="rounded-lg bg-[#E53935] px-6 py-2 text-sm font-medium text-white hover:bg-[#EF5350] disabled:opacity-50">
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
