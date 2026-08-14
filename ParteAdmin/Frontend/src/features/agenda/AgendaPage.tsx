import { useState } from "react";
import { useAgenda } from "./hooks/useAgenda";
import { AgendaHeader } from "./components/AgendaHeader";
import { TimeGrid } from "./components/TimeGrid";
import { TurnoModal } from "./components/TurnoModal";
import { Loader2 } from "lucide-react";

export function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProfesionalId, setSelectedProfesionalId] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { turnos, profesionales, loading, error, createTurno } = useAgenda(currentDate, selectedProfesionalId);

  return (
    <div className="flex h-full flex-col space-y-6 animate-in fade-in duration-500">
      <AgendaHeader
        currentDate={currentDate}
        onChangeDate={setCurrentDate}
        profesionales={profesionales}
        selectedProfesionalId={selectedProfesionalId}
        onChangeProfesional={setSelectedProfesionalId}
        onNewTurno={() => setIsModalOpen(true)}
      />

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#E53935]" />
          <span className="ml-3 text-gray-500">Cargando agenda...</span>
        </div>
      ) : (
        <TimeGrid currentDate={currentDate} turnos={turnos} />
      )}

      {isModalOpen && (
        <TurnoModal
          profesionales={profesionales}
          initialProfesionalId={selectedProfesionalId}
          initialDate={currentDate}
          onClose={() => setIsModalOpen(false)}
          onSave={createTurno}
        />
      )}
    </div>
  );
}
