import { Search, Edit2, Phone, Mail, Calendar } from "lucide-react";
import type { Paciente } from "../hooks/usePacientes";

interface PacientesTableProps {
  pacientes: Paciente[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onEdit: (paciente: Paciente) => void;
}

export function PacientesTable({ pacientes, searchQuery, onSearchChange, onEdit }: PacientesTableProps) {
  // Filter logic
  const filtered = pacientes.filter((p) => {
    const term = searchQuery.toLowerCase();
    return (
      p.nombre_completo.toLowerCase().includes(term) ||
      p.telefono_whatsapp.toLowerCase().includes(term) ||
      (p.email && p.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/5 bg-[#121212] shadow-xl overflow-hidden">
      {/* Table Header/Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-white/5 bg-[#1a1a1a]">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#121212] pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-[#E53935] focus:outline-none focus:ring-1 focus:ring-[#E53935] transition-colors"
          />
        </div>
        <div className="text-sm text-gray-500">
          Mostrando <span className="font-medium text-white">{filtered.length}</span> pacientes
        </div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-gray-500">
            <p>No se encontraron pacientes que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="sticky top-0 bg-[#1a1a1a] text-xs uppercase text-gray-500 border-b border-white/5 z-10">
              <tr>
                <th className="px-6 py-4 font-medium">Nombre Completo</th>
                <th className="px-6 py-4 font-medium">Contacto</th>
                <th className="px-6 py-4 font-medium">Nacimiento</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((paciente) => (
                <tr key={paciente.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 font-medium text-white">
                    {paciente.nombre_completo}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Phone size={14} className="text-gray-500" />
                        {paciente.telefono_whatsapp}
                      </div>
                      {paciente.email && (
                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                          <Mail size={14} className="text-gray-500" />
                          {paciente.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {paciente.fecha_nacimiento ? (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar size={14} className="text-gray-500" />
                        {new Date(paciente.fecha_nacimiento).toLocaleDateString("es-AR")}
                      </div>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {paciente.activo ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500 border border-emerald-500/20">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500 border border-red-500/20">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onEdit(paciente)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Editar Paciente"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
