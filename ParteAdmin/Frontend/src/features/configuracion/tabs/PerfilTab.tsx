import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../auth/AuthContext";

export function PerfilTab() {
  const { profile } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;
      
      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Error al actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col animate-in fade-in duration-300">
      <div className="border-b border-white/10 p-6">
        <h2 className="text-xl font-bold font-[var(--font-display)] text-white">Mi Cuenta</h2>
        <p className="mt-1 text-sm text-gray-400">
          Gestioná tus credenciales de acceso a MedApp.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-xl">
        <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6 mb-6">
          <h3 className="text-lg font-medium text-white mb-1">Datos Personales</h3>
          <p className="text-sm text-gray-400 mb-4">Información registrada en el sistema.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nombre</label>
              <div className="text-white font-medium">{profile?.nombre}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Rol</label>
              <div className="inline-block rounded-full bg-[#E53935]/10 px-2 py-1 text-xs font-medium text-[#E53935]">
                {profile?.rol}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-gray-800 p-2">
              <KeyRound size={18} className="text-gray-300" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Cambiar Contraseña</h3>
              <p className="text-sm text-gray-400">Te recomendamos usar una contraseña segura.</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg bg-green-500/10 p-3 text-sm text-green-500 border border-green-500/20">
              Contraseña actualizada correctamente.
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nueva Contraseña</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#121212] px-4 py-2 text-white focus:border-[#E53935] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Confirmar Contraseña</label>
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#121212] px-4 py-2 text-white focus:border-[#E53935] focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="flex items-center justify-center w-full sm:w-auto rounded-lg bg-[#E53935] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#EF5350] disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? "Actualizando..." : "Actualizar Contraseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
