import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zrzphrcmkeivjcxchars.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyenBocmNta2VpdmpjeGNoYXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NzQ1MTAsImV4cCI6MjEwMjE1MDUxMH0.OAgtg-A28lFK6Fc3x8IdOjucjhcCBAUdY3szvGqG_os';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  // 1. Insertar Clínica
  const { data: clinica, error: errC } = await supabase.from('clinicas').insert({
    nombre: 'Clínica MedAPP Central',
    telefono: '+5491100000000'
  }).select().single();

  if (errC) {
    console.error('Error clinica:', errC);
    // Si falla por RLS (anon no puede insertar), intentamos hacer select por si ya hay una
    return;
  }

  const clinicaId = clinica.id;

  // 2. Insertar Profesional
  const { data: prof, error: errP } = await supabase.from('profesionales').insert({
    clinica_id: clinicaId,
    nombre: 'Dra. Ana López',
    especialidad: 'Cardiología',
    activo: true
  }).select().single();

  if (errP) {
    console.error('Error prof:', errP);
    return;
  }

  // 3. Insertar Disponibilidad (Lunes a Viernes de 9 a 17)
  for (let i = 1; i <= 5; i++) {
    await supabase.from('disponibilidad').insert({
      clinica_id: clinicaId,
      profesional_id: prof.id,
      dia_semana: i,
      horario_inicio: '09:00:00',
      horario_fin: '17:00:00',
      habilitado: true
    });
  }

  console.log('Seed completado. CLINICA_ID=', clinicaId);
}

seed();
