import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Route guard that redirects unauthenticated users to /login.
 * Wraps protected routes as a layout route in React Router.
 */
export function AuthGuard() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#121212]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
