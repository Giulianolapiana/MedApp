import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Lock, Mail, Loader2, CalendarHeart } from "lucide-react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError("Credenciales inválidas. Verificá tu correo y contraseña.");
      setIsSubmitting(false);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#121212]">
      {/* Visual / Brand Panel (Left side on desktop) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[#1a1a1a] p-12 relative overflow-hidden border-r border-white/5">
        {/* Abstract Background Decoration */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#E53935]/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-[#E53935]/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10 flex items-center gap-3">
          <CalendarHeart className="text-[#E53935]" size={32} />
          <span className="text-2xl font-bold tracking-tight text-white font-[var(--font-display)]">
            <span className="text-[#E53935]">Med</span>App
          </span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold text-white mb-6 leading-tight font-[var(--font-display)]">
            Gestión inteligente para consultorios ambulatorios.
          </h2>
          <p className="text-gray-400 text-lg">
            Plataforma SaaS multi-tenant diseñada para optimizar la ocupación, 
            reducir el ausentismo y simplificar tu administración.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-gray-500">
          <span>&copy; {new Date().getFullYear()} blenexIA.</span>
          <span>Todos los derechos reservados.</span>
        </div>
      </div>

      {/* Form Panel (Right side) */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden text-center flex flex-col items-center">
            <div className="bg-[#1a1a1a] p-3 rounded-2xl inline-flex mb-4 border border-white/5 shadow-xl">
              <CalendarHeart className="text-[#E53935]" size={36} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white font-[var(--font-display)]">
              <span className="text-[#E53935]">Med</span>App
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white font-[var(--font-display)]">
              Bienvenido de vuelta
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Ingresá tus credenciales para acceder al portal administrativo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-500 border border-red-500/20 flex items-start">
                <span>{error}</span>
              </div>
            ) : null}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-300"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-white/10 bg-black/30 py-2.5 pl-10 pr-3 text-white placeholder-gray-500 transition-colors focus:border-[#E53935] focus:outline-none focus:ring-1 focus:ring-[#E53935] sm:text-sm"
                  placeholder="recepcion@clinica.com"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300"
                >
                  Contraseña
                </label>
                {/* Placeholder for future feature */}
                <a href="#" className="text-xs font-medium text-[#E53935] hover:text-[#EF5350]">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-white/10 bg-black/30 py-2.5 pl-10 pr-3 text-white placeholder-gray-500 transition-colors focus:border-[#E53935] focus:outline-none focus:ring-1 focus:ring-[#E53935] sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#E53935] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#E53935]/20 transition-all hover:bg-[#EF5350] hover:shadow-[#E53935]/40 focus:outline-none focus:ring-2 focus:ring-[#E53935] focus:ring-offset-2 focus:ring-offset-[#121212] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
