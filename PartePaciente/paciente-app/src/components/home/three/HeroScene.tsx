import { useEffect, useRef } from 'react';
import { SlotWeekScene, type SlotSeleccionado } from './SlotWeekScene';

interface HeroSceneProps {
  onSelect?: (slot: SlotSeleccionado) => void;
}

/**
 * Contenedor React de la escena 3D. Se carga con React.lazy para que three.js
 * no pese en la primera pintura. Si el navegador no tiene WebGL, el contenedor
 * queda vacío (el hero sigue siendo usable).
 */
export default function HeroScene({ onSelect }: HeroSceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let scene: SlotWeekScene | null = null;
    try {
      scene = new SlotWeekScene(el, {
        reducedMotion,
        onSelect: (slot) => onSelectRef.current?.(slot),
      });
    } catch (err) {
      console.warn('WebGL no disponible, se omite la escena 3D', err);
    }
    return () => scene?.dispose();
  }, []);

  return <div ref={ref} className="absolute inset-0" />;
}
