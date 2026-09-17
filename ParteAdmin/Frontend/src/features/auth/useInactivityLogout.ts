import { useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

export function useInactivityLogout(timeoutMinutes: number = 30) {
  const { session, signOut } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!session) return;

    const logout = async () => {
      console.log(`Cerrando sesión por inactividad (${timeoutMinutes} minutos)`);
      await signOut();
      window.location.href = '/login'; // Forzar recarga a login
    };

    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(logout, timeoutMinutes * 60 * 1000);
    };

    // Eventos que reinician el temporizador
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Iniciar el temporizador la primera vez
    resetTimer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [session, signOut, timeoutMinutes]);
}
