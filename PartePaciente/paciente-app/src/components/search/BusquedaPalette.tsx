import { createElement, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, CornerDownLeft } from 'lucide-react';
import { useReserva } from '../../context/ReservaContext';
import { getEspecialidades } from '../../services/especialidades.service';
import { aMedico, getProfesionalesActivos, type ProfesionalApi } from '../../services/medicos.service';
import { iconoEspecialidad, normalizar } from '../../lib/texto';
import { Avatar } from '../ui/Avatar';
import type { Especialidad } from '../../types';
import { EVENTO_ABRIR_BUSQUEDA } from '../../lib/busqueda';

type Resultado =
  | { tipo: 'especialidad'; id: string; especialidad: Especialidad; cantidad: number }
  | { tipo: 'medico'; id: string; profesional: ProfesionalApi };


/**
 * Paleta de búsqueda de especialidades y médicos. Se abre con la lupa de la navbar,
 * con ⌘K / Ctrl+K, con "/" o con abrirBusqueda(). Se monta una sola vez en la Navbar.
 */
export function BusquedaPalette() {
  const [abierta, setAbierta] = useState(false);
  const [query, setQuery] = useState('');
  const [activo, setActivo] = useState(0);
  const [especialidades, setEspecialidades] = useState<Especialidad[] | null>(null);
  const [profesionales, setProfesionales] = useState<ProfesionalApi[] | null>(null);
  const [error, setError] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const focoPrevio = useRef<HTMLElement | null>(null);
  const listId = useId();
  const navigate = useNavigate();
  const { setEspecialidad, setMedico, setFecha, setSlotHora, setPasoActual } = useReserva();

  const pedido = useRef(false);

  const cargarDatos = useCallback(() => {
    // Los datos se piden recién la primera vez que se abre (o de nuevo si falló).
    if (pedido.current) return;
    pedido.current = true;
    setError(false);
    Promise.all([getEspecialidades(), getProfesionalesActivos()])
      .then(([esp, prof]) => {
        setEspecialidades(esp);
        setProfesionales(prof);
      })
      .catch(() => {
        pedido.current = false;
        setEspecialidades([]);
        setProfesionales([]);
        setError(true);
      });
  }, []);

  const abrir = useCallback(() => {
    focoPrevio.current = document.activeElement as HTMLElement | null;
    if (error) {
      setEspecialidades(null);
      setProfesionales(null);
    }
    cargarDatos();
    setAbierta(true);
  }, [cargarDatos, error]);

  const cerrar = useCallback(() => {
    setAbierta(false);
    setQuery('');
    setActivo(0);
    focoPrevio.current?.focus?.();
  }, []);

  // Atajos: ⌘K / Ctrl+K y "/" (cuando no se está escribiendo en otro campo).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const escribiendo = (e.target as HTMLElement)?.closest?.('input, textarea, select, [contenteditable]');
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !escribiendo)) {
        e.preventDefault();
        if (abierta) cerrar();
        else abrir();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener(EVENTO_ABRIR_BUSQUEDA, abrir);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(EVENTO_ABRIR_BUSQUEDA, abrir);
    };
  }, [abierta, abrir, cerrar]);

  // Foco en el input y bloqueo del scroll de fondo mientras está abierta.
  useEffect(() => {
    if (!abierta) return;
    inputRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [abierta]);

  const resultados = useMemo<Resultado[]>(() => {
    if (!especialidades || !profesionales) return [];
    const q = normalizar(query);
    const porEsp = new Map<string, number>();
    profesionales.forEach((p) => porEsp.set(p.especialidad, (porEsp.get(p.especialidad) ?? 0) + 1));

    const esp: Resultado[] = especialidades
      .filter((e) => !q || normalizar(e.nombre).includes(q))
      .map((e) => ({ tipo: 'especialidad', id: `esp-${e.id}`, especialidad: e, cantidad: porEsp.get(e.nombre) ?? 0 }));

    const med: Resultado[] = profesionales
      .filter((p) => !q || normalizar(p.nombre).includes(q) || normalizar(p.especialidad).includes(q))
      .slice(0, q ? 8 : 5)
      .map((p) => ({ tipo: 'medico', id: `med-${p.id}`, profesional: p }));

    return [...esp, ...med];
  }, [query, especialidades, profesionales]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activo}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activo]);

  const elegir = (r: Resultado) => {
    setFecha(null);
    setSlotHora(null);
    if (r.tipo === 'especialidad') {
      setEspecialidad(r.especialidad);
      setMedico(null);
      setPasoActual(2);
    } else {
      const p = r.profesional;
      const esp = especialidades?.find((e) => e.nombre === p.especialidad) ?? { id: p.especialidad, nombre: p.especialidad };
      setEspecialidad(esp);
      setMedico(aMedico(p));
      setPasoActual(3);
    }
    setAbierta(false);
    setQuery('');
    navigate('/reserva');
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActivo((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && resultados[activo]) {
      e.preventDefault();
      elegir(resultados[activo]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cerrar();
    }
  };

  const cargando = abierta && especialidades === null;
  const idxPrimerMedico = resultados.findIndex((r) => r.tipo === 'medico');

  return (
    <>
      {abierta &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-start sm:pt-[12vh]">
            <div className="absolute inset-0 bg-brand-950/50 backdrop-blur-[3px]" onClick={cerrar} aria-hidden="true" />

            <div
              role="dialog"
              aria-modal="true"
              aria-label="Buscar especialidad o médico"
              onKeyDown={(e) => {
                // Trampa de foco simple: solo hay dos elementos enfocables (input y cerrar).
                if (e.key !== 'Tab') return;
                const focusables = e.currentTarget.querySelectorAll<HTMLElement>('input, button');
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }}
              className="relative flex max-h-[80vh] w-full max-w-xl animate-palette-in flex-col overflow-hidden rounded-t-3xl border border-border-soft bg-surface shadow-2xl sm:mx-4 sm:rounded-3xl"
            >
              <div className="flex items-center gap-3 border-b border-border-soft px-5">
                <Search size={20} className="shrink-0 text-brand-600" aria-hidden="true" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActivo(0);
                  }}
                  onKeyDown={onInputKey}
                  role="combobox"
                  aria-expanded="true"
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={resultados[activo] ? `${listId}-${resultados[activo].id}` : undefined}
                  placeholder="Especialidad o apellido del médico"
                  className="h-16 flex-1 bg-transparent text-lg text-text-primary placeholder:text-text-muted focus:outline-none"
                  style={{ outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={cerrar}
                  className="rounded-full p-2 text-text-muted hover:bg-bg-base hover:text-text-primary"
                  aria-label="Cerrar búsqueda"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto overscroll-contain p-2">
                {cargando ? (
                  <div className="flex items-center justify-center gap-3 py-10 text-text-secondary">
                    <Loader2 className="animate-spin text-brand-600" size={20} aria-hidden="true" />
                    Cargando especialidades y médicos…
                  </div>
                ) : error ? (
                  <p className="px-4 py-10 text-center text-text-secondary">
                    No pudimos cargar la lista. Revisá tu conexión y volvé a abrir la búsqueda.
                  </p>
                ) : resultados.length === 0 ? (
                  <p className="px-4 py-10 text-center text-text-secondary">
                    No hay coincidencias para «{query}». Probá con el nombre de la especialidad.
                  </p>
                ) : (
                  <ul ref={listRef} id={listId} role="listbox" aria-label="Resultados">
                    {resultados.map((r, i) => {
                      const seleccionado = i === activo;
                      const encabezado =
                        i === 0 && r.tipo === 'especialidad'
                          ? 'Especialidades'
                          : i === idxPrimerMedico
                            ? query
                              ? 'Médicos'
                              : 'Algunos de nuestros médicos'
                            : null;
                      return (
                        <li key={r.id} role="presentation">
                          {encabezado && (
                            <p role="presentation" className="px-3 pt-3 pb-1.5 text-sm font-bold text-text-muted">
                              {encabezado}
                            </p>
                          )}
                          <div
                            id={`${listId}-${r.id}`}
                            role="option"
                            aria-selected={seleccionado}
                            data-index={i}
                            onMouseMove={() => setActivo(i)}
                            onClick={() => elegir(r)}
                            className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 ${
                              seleccionado ? 'bg-brand-50' : ''
                            }`}
                          >
                            {r.tipo === 'especialidad' ? (
                              <IconoEsp nombre={r.especialidad.nombre} activo={seleccionado} />
                            ) : (
                              <Avatar nombre={r.profesional.nombre} size={40} />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-text-primary">
                                {r.tipo === 'especialidad' ? r.especialidad.nombre : r.profesional.nombre}
                              </p>
                              <p className="truncate text-sm text-text-secondary">
                                {r.tipo === 'especialidad'
                                  ? r.cantidad === 1
                                    ? '1 profesional'
                                    : `${r.cantidad} profesionales`
                                  : r.profesional.especialidad}
                              </p>
                            </div>
                            {seleccionado && (
                              <span className="hidden items-center gap-1 text-sm text-brand-700 sm:flex">
                                {r.tipo === 'especialidad' ? 'Ver médicos' : 'Ver horarios'}
                                <CornerDownLeft size={14} aria-hidden="true" />
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="hidden items-center gap-4 border-t border-border-soft px-5 py-3 text-xs text-text-muted sm:flex">
                <span>
                  <kbd className="font-sans">↑</kbd> <kbd className="font-sans">↓</kbd> para moverte
                </span>
                <span>
                  <kbd className="font-sans">Enter</kbd> para elegir
                </span>
                <span>
                  <kbd className="font-sans">Esc</kbd> para cerrar
                </span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function IconoEsp({ nombre, activo }: { nombre: string; activo: boolean }) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
        activo ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'
      }`}
      aria-hidden="true"
    >
      {createElement(iconoEspecialidad(nombre), { size: 20, strokeWidth: 1.75 })}
    </span>
  );
}
