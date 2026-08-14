import { useState } from "react";
import { Plus, Users, Loader2 } from "lucide-react";
import { usePacientes, type Paciente, type PacienteInsert } from "./hooks/usePacientes";
import { PacientesTable } from "./components/PacientesTable";
import { PacienteModal } from "./components/PacienteModal";

export function PacientesPage() {
  const { pacientes, loading, error, createPaciente, updatePaciente } = usePacientes();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);

  const handleOpenNew = () => {
    setEditingPaciente(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (paciente: Paciente) => {
    setEditingPaciente(paciente);
    setIsModalOpen(true);
  };

  const handleSave = async (pacienteData: Partial<PacienteInsert>) => {
    if (editingPaciente) {
      await updatePaciente(editingPaciente.id, pacienteData);
    } else {
      await createPaciente(pacienteData as Omit<PacienteInsert, "clinica_id">);
    }
  };

  return (
    <div className="flex h-full flex-col space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#E53935]/10 p-2 border border-[#E53935]/20">
            <Users className="text-[#E53935]" size={24} />
          </div>
          <h1 className="text-2xl font-bold font-[var(--font-display)] text-white">Pacientes</h1>
        </div>

        <button 
          onClick={handleOpenNew}
          className="flex items-center gap-2 rounded-lg bg-[#E53935] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#E53935]/20 hover:bg-[#EF5350] transition-colors w-full sm:w-auto justify-center"
        >
          <Plus size={16} />
          Nuevo Paciente
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        {error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
            <strong>Error al cargar pacientes:</strong> {error}
          </div>
        ) : loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#E53935]" />
            <span className="ml-3 text-gray-500">Cargando base de pacientes...</span>
          </div>
        ) : (
          <PacientesTable 
            pacientes={pacientes} 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onEdit={handleOpenEdit}
          />
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <PacienteModal 
          paciente={editingPaciente} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
}
