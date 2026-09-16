import { HeartPulse, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-soft bg-surface/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-brand-100 p-2 rounded-lg text-brand-600">
            <HeartPulse size={24} strokeWidth={2.5} />
          </div>
          <span className="font-display font-semibold text-xl tracking-tight text-text-primary">
            MedAPP
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="/#especialidades" className="text-sm font-medium text-text-secondary hover:text-brand-600 transition-colors">Especialidades</a>
          <Link to="/medicos" className="text-sm font-medium text-text-secondary hover:text-brand-600 transition-colors">Médicos</Link>
          <a href="/#como-funciona" className="text-sm font-medium text-text-secondary hover:text-brand-600 transition-colors">Cómo funciona</a>
        </nav>
        
        <div className="flex items-center gap-4">
          <Link 
            to="/reserva" 
            className="hidden md:flex items-center justify-center rounded-full bg-brand-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-all active:scale-95"
          >
            Sacar turno
          </Link>
          <button className="md:hidden p-2 text-text-secondary hover:bg-brand-50 rounded-lg">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </header>
  );
}
