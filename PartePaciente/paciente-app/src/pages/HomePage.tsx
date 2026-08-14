import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/home/Hero';
import { EspecialidadesSection } from '../components/home/EspecialidadesSection';
import { ComoFunciona } from '../components/home/ComoFunciona';
import { Beneficios } from '../components/home/Beneficios';
import { CtaSection } from '../components/home/CtaSection';

export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        <Hero />
        <EspecialidadesSection />
        <ComoFunciona />
        <Beneficios />
        <CtaSection />
      </main>
      
      <Footer />
    </div>
  );
}
