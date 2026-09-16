import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ReservaPage } from './pages/ReservaPage';
import { MedicosPage } from './pages/MedicosPage';
import { PrivacidadPage } from './pages/PrivacidadPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/medicos" element={<MedicosPage />} />
      <Route path="/reserva" element={<ReservaPage />} />
      <Route path="/privacidad" element={<PrivacidadPage />} />
    </Routes>
  );
}

export default App;
