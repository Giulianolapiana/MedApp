import { createClient } from '@supabase/supabase-js';
import { db } from './src/core/database.js';
import { usuariosAdministrativos, profesionales } from './src/db/schema.js';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Fetch clinicaId instead of hardcoding
  const { clinicas } = await import('./src/db/schema.js');
  const clinica = await db.select().from(clinicas).limit(1);
  if (clinica.length === 0) {
      throw new Error('No hay clínicas en la base de datos');
  }
  const clinicaId = clinica[0].id;

  const email = 'doctor@medapp.com';
  const password = 'password123';
  
  console.log(`Intentando crear usuario en Supabase Auth con email: ${email}`);

  // Crear usuario en Supabase Auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already been registered')) {
        console.log('El usuario ya existe en Supabase Auth. Asegurate de que esté en las tablas de MedApp.');
    } else {
        throw new Error(`Error en Supabase Auth: ${authError.message}`);
    }
  }

  // Get user id (if just created or if we need to fetch it)
  let userId;
  if (authUser?.user) {
      userId = authUser.user.id;
  } else {
      const { data } = await supabaseAdmin.auth.admin.listUsers();
      const found = data.users.find(u => u.email === email);
      if (found) userId = found.id;
      else throw new Error('No se pudo obtener el ID del usuario');
  }

  // Check if exists in db
  const existing = await db.select().from(usuariosAdministrativos).where(eq(usuariosAdministrativos.id, userId));
  if (existing.length === 0) {
      await db.insert(usuariosAdministrativos).values({
        id: userId,
        nombre: 'Dr. Prueba Médico',
        rol: 'PROFESIONAL',
        clinica_id: clinicaId,
      });
      console.log('Usuario insertado en usuarios_administrativos');
  } else {
      console.log('El usuario ya existía en usuarios_administrativos');
  }

  // Check profesional
  const existingProf = await db.select().from(profesionales).where(eq(profesionales.usuario_id, userId));
  if (existingProf.length === 0) {
      await db.insert(profesionales).values({
        id: crypto.randomUUID(),
        clinica_id: clinicaId,
        usuario_id: userId,
        nombre: 'Dr. Prueba Médico',
        especialidad: 'Cardiología',
        activo: true,
      });
      console.log('Profesional insertado en profesionales');
  } else {
      console.log('El profesional ya existía en la tabla profesionales');
  }

  console.log('¡Médico creado con éxito!');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  process.exit(0);
}

main().catch(console.error);
