import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/pacientes", label: "Pacientes", icon: Users },
  { to: "/configuracion", label: "Configuración", icon: Settings },
] as const;

export function AppLayout() {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#121212] text-gray-100">
      {/* ---- Sidebar ---- */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10
          bg-[#1a1a1a] transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <span className="text-xl font-bold tracking-tight font-[var(--font-display)]">
            <span className="text-[#E53935]">Med</span>App
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${
                  isActive
                    ? "bg-[#E53935]/15 text-[#E53935]"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-100"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User & Sign Out */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 text-xs text-gray-500">
            {profile?.nombre ?? "Cargando..."}
            <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
              {profile?.rol ?? "..."}
            </span>
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-red-400"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ---- Mobile overlay ---- */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ---- Main content ---- */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar (mobile menu trigger) */}
        <header className="flex h-16 shrink-0 items-center border-b border-white/10 bg-[#121212] px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Menu size={20} />
          </button>
          <span className="ml-3 text-lg font-bold font-[var(--font-display)]">
            <span className="text-[#E53935]">Med</span>App
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
