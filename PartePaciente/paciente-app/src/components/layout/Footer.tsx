import { Link } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-border-soft py-12 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="text-brand-600">
            <HeartPulse size={24} />
          </div>
          <span className="font-display font-semibold text-xl text-text-primary">
            MedAPP
          </span>
        </div>
        
        <div className="flex gap-6 text-sm text-text-secondary">
          <Link to="/privacidad" className="hover:text-brand-600">Privacidad</Link>
        </div>
        
        <p className="text-sm text-text-muted">
          © {new Date().getFullYear()} MedAPP. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
