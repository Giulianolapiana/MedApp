import { useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

interface TiltCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** Grados máximos de inclinación. */
  max?: number;
}

/**
 * Botón-tarjeta que se inclina en 3D siguiendo al puntero, con un brillo que
 * acompaña al cursor. Los hijos con la clase `tilt-pop` quedan "delante" (translateZ).
 * Solo se activa con mouse/trackpad y sin prefers-reduced-motion.
 */
export function TiltCard({ children, max = 10, className = '', style, ...rest }: TiltCardProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const frame = useRef(0);

  const habilitado = () =>
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!habilitado()) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--rx', `${(0.5 - y) * max}deg`);
      el.style.setProperty('--ry', `${(x - 0.5) * max}deg`);
      el.style.setProperty('--gx', `${x * 100}%`);
      el.style.setProperty('--gy', `${y * 100}%`);
      el.style.setProperty('--glow', '1');
    });
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--glow', '0');
  };

  return (
    <div style={{ perspective: '900px' }} className="h-full">
      <button
        ref={ref}
        onPointerMove={onPointerMove}
        onPointerLeave={reset}
        onBlur={reset}
        className={`group relative h-full w-full [transform-style:preserve-3d] transition-transform duration-200 ease-out ${className}`}
        style={{
          transform: 'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
          ...style,
        }}
        {...rest}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity: 'var(--glow, 0)',
            background: 'radial-gradient(220px circle at var(--gx, 50%) var(--gy, 50%), rgb(47 190 168 / 0.18), transparent 65%)',
          }}
        />
        {children}
      </button>
    </div>
  );
}
