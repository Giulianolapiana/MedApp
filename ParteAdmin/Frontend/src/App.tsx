import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthContext";
import { AuthGuard } from "./features/auth/AuthGuard";
import { LoginPage } from "./features/auth/LoginPage";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { AgendaPage } from "./features/agenda/AgendaPage";
import { PacientesPage } from "./features/pacientes/PacientesPage";
import { ConfiguracionPage } from "./features/configuracion/ConfiguracionPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas protegidas */}
          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/agenda" element={<AgendaPage />} />
              <Route path="/pacientes" element={<PacientesPage />} />
              <Route path="/configuracion" element={<ConfiguracionPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
