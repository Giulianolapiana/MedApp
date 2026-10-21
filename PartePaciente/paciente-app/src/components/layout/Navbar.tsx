import { useEffect, useState } from 'react';
import { HeartPulse, Menu, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BusquedaPalette } from '../search/BusquedaPalette';
import { abrirBusqueda, esMac } from '../../lib/busqueda';

const LINKS = [
  { href: '/#especialidades', label: 'Especialidades' },
  { href: '/medicos', label: 'Médicos', route: true },
  { href: '/#como-funciona', label: 'Cómo funciona' },
];

interface NavbarProps {
  /** En la home la barra flota sobre el hero; en el resto se reserva su alto. */
  sobreHero?: boolean;
}

/**
 * Navbar flotante: una cápsula separada de los bordes que queda fija arriba.
 * Al hacer scroll se compacta y gana sombra. Incluye la lupa que abre la búsqueda.
 */
export function Navbar({ sobreHero = false }: NavbarProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [scrolleado, setScrolleado] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolleado(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const atajo = `${esMac ? '⌘' : 'Ctrl'} K`;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
        <div
          className={`mx-auto max-w-6xl rounded-[1.75rem] border bg-surface/92 backdrop-blur-xl transition-[box-shadow,border-color,padding] duration-300 ${
            scrolleado || menuAbierto
              ? 'border-border-soft shadow-[0_14px_40px_-16px_rgb(7_42_48/0.45)]'
              : 'border-white/40 shadow-[0_8px_30px_-18px_rgb(7_42_48/0.5)]'
          }`}
        >
          <div className={`flex items-center justify-between gap-3 pr-2 pl-3 transition-[height] duration-300 ${scrolleado ? 'h-14' : 'h-16'}`}>
            <Link to="/" className="flex items-center gap-2" aria-label="MedAPP, inicio">
              <span className="rounded-xl bg-brand-900 p-2 text-signal">
                <HeartPulse size={20} strokeWidth={2.5} aria-hidden="true" />
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-text-primary">MedAPP</span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
              {LINKS.map((l) =>
                l.route ? (
                  <Link key={l.href} to={l.href} className="rounded-full px-4 py-2 text-[0.95rem] font-medium text-text-secondary transition-colors hover:bg-brand-50 hover:text-brand-800">
                    {l.label}
                  </Link>
                ) : (
                  <a key={l.href} href={l.href} className="rounded-full px-4 py-2 text-[0.95rem] font-medium text-text-secondary transition-colors hover:bg-brand-50 hover:text-brand-800">
                    {l.label}
                  </a>
                ),
              )}
            </nav>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={abrirBusqueda}
                aria-label={`Buscar especialidad o médico (${atajo})`}
                title={`Buscar (${atajo})`}
                className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-brand-50 hover:text-brand-800"
              >
                <Search size={20} strokeWidth={2.25} aria-hidden="true" />
              </button>
              <Link
                to="/reserva"
                className="hidden items-center justify-center rounded-full bg-brand-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800 md:flex"
              >
                Sacar turno
              </Link>
              <button
                type="button"
                onClick={() => setMenuAbierto((v) => !v)}
                aria-expanded={menuAbierto}
                aria-controls="menu-mobile"
                aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
                className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary hover:bg-brand-50 md:hidden"
              >
                {menuAbierto ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {menuAbierto && (
            <nav id="menu-mobile" aria-label="Principal" className="border-t border-border-soft px-4 pt-2 pb-4 md:hidden">
              <ul className="flex flex-col">
                {LINKS.map((l) => (
                  <li key={l.href}>
                    {l.route ? (
                      <Link to={l.href} onClick={() => setMenuAbierto(false)} className="block py-3 text-lg font-medium text-text-primary">
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} onClick={() => setMenuAbierto(false)} className="block py-3 text-lg font-medium text-text-primary">
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              <Link
                to="/reserva"
                onClick={() => setMenuAbierto(false)}
                className="mt-2 flex items-center justify-center rounded-full bg-brand-900 py-3.5 font-bold text-white"
              >
                Sacar turno
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* Reserva el alto de la barra en las páginas sin hero de fondo. */}
      {!sobreHero && <div aria-hidden="true" className="h-20 sm:h-24" />}

      <BusquedaPalette />
    </>
  );
}
