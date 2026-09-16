import { useState } from "react";
import { useAgenda } from "./hooks/useAgenda";
import { AgendaHeader } from "./components/AgendaHeader";
import { TimeGrid } from "./components/TimeGrid";
import { TurnoModal } from "./components/TurnoModal";
import { Loader2 } from "lucide-react";
import { EstadoTurnoModal } from "./components/EstadoTurnoModal";

export function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProfesionalId, setSelectedProfesionalId] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<any>(null);

  const { turnos, profesionales, loading, error, createTurno, updateTurnoStatus } = useAgenda(currentDate, selectedProfesionalId);

  return (
    <div className="flex h-full flex-col space-y-4 animate-in fade-in duration-500">
      <AgendaHeader
        currentDate={currentDate}
        onChangeDate={setCurrentDate}
        profesionales={profesionales}
        selectedProfesionalId={selectedProfesionalId}
        onChangeProfesional={setSelectedProfesionalId}
        onNewTurno={() => setIsModalOpen(true)}
      />

      {error && (
        <div className="rounded-lg bg-red-500/10 p-4 text-red-500 border border-red-500/20">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#E53935]" />
          <span className="ml-3 text-gray-500">Cargando agenda...</span>
        </div>
      ) : (
        <TimeGrid currentDate={currentDate} turnos={turnos} onTurnoClick={setSelectedTurno} />
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

      {selectedTurno && (
        <EstadoTurnoModal
          turno={selectedTurno}
          onClose={() => setSelectedTurno(null)}
          onSave={updateTurnoStatus}
        />
      )}
    </div>
  );
}
