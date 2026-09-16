import { useState } from "react";
import { Settings, Stethoscope, Clock, HardDrive, ShieldCheck, BookOpen, User } from "lucide-react";
import { ProfesionalesTab } from "./tabs/ProfesionalesTab";
import { DisponibilidadTab } from "./tabs/DisponibilidadTab";
import { EspecialidadesTab } from "./tabs/EspecialidadesTab";
import { BackupsTab } from "./tabs/BackupsTab";
import { PerfilTab } from "./tabs/PerfilTab";
import { useAuth } from "../auth/AuthContext";

type TabId = "profesionales" | "especialidades" | "disponibilidad" | "backups" | "perfil";

export function ConfiguracionPage() {
  const { profile } = useAuth();
  const isProfesional = profile?.rol === "PROFESIONAL";
  const [activeTab, setActiveTab] = useState<TabId>(isProfesional ? "perfil" : "profesionales");

  return (
    <div className="flex h-full flex-col space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-5">
        <div className="rounded-lg bg-[#E53935]/10 p-2 border border-[#E53935]/20">
          <Settings className="text-[#E53935]" size={24} />
        </div>
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-white">
          {isProfesional ? "Mi Perfil" : "Configuración"}
        </h1>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row gap-8 min-h-0 overflow-hidden">
        {/* Sidebar Nav (Tabs) */}
        <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
          {isProfesional && (
            <TabButton 
              active={activeTab === "perfil"} 
              onClick={() => setActiveTab("perfil")}
              icon={<User size={18} />}
              label="Mi Cuenta"
            />
          )}

          {!isProfesional && (
            <>
              <TabButton 
                active={activeTab === "profesionales"} 
                onClick={() => setActiveTab("profesionales")}
                icon={<Stethoscope size={18} />}
                label="Profesionales"
              />
              <TabButton 
                active={activeTab === "especialidades"} 
                onClick={() => setActiveTab("especialidades")}
                icon={<BookOpen size={18} />}
                label="Especialidades"
              />
            </>
          )}

          <TabButton 
            active={activeTab === "disponibilidad"} 
            onClick={() => setActiveTab("disponibilidad")}
            icon={<Clock size={18} />}
            label={isProfesional ? "Mis Horarios" : "Disponibilidad"}
          />
          
          {!isProfesional && (
            <TabButton 
              active={activeTab === "backups"} 
              onClick={() => setActiveTab("backups")}
              icon={<HardDrive size={18} />}
              label="Backups / Auditoría"
            />
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 rounded-2xl border border-white/5 bg-[#121212] shadow-xl overflow-y-auto">
          {activeTab === "perfil" && <PerfilTab />}
          {activeTab === "profesionales" && <ProfesionalesTab />}
          {activeTab === "especialidades" && <EspecialidadesTab />}
          {activeTab === "disponibilidad" && <DisponibilidadTab />}
          {activeTab === "backups" && <BackupsTab />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
        active 
          ? "bg-[#E53935]/10 text-[#E53935] border border-[#E53935]/20" 
          : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
