import { db } from '../backend/src/core/database.js';
import { usuariosAdministrativos, profesionales } from '../backend/src/db/schema.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

async function main() {
  const clinicaId = '00000000-0000-0000-0000-000000000001'; // Default clinic
  const password = await bcrypt.hash('123456', 10);
  const email = 'doctor@medapp.com';
  
  // Check if exists
  const existing = await db.select().from(usuariosAdministrativos).where(eq(usuariosAdministrativos.email, email));
  if (existing.length > 0) {
     console.log('El usuario ya existe.');
     console.log(`Email: ${email}`);
     console.log(`Password: 123456`);
     process.exit(0);
  }

  const userId = uuidv4();

  await db.insert(usuariosAdministrativos).values({
    id: userId,
    email: email,
    password_hash: password,
    rol: 'PROFESIONAL',
    clinica_id: clinicaId,
    nombre_completo: 'Dr. Prueba Médico',
  });

  await db.insert(profesionales).values({
    id: uuidv4(),
    clinica_id: clinicaId,
    usuario_id: userId,
    nombre: 'Dr. Prueba Médico',
    especialidad: 'Cardiología',
    activo: true,
  });

  console.log('¡Médico creado con éxito!');
  console.log(`Email: ${email}`);
  console.log(`Password: 123456`);
  process.exit(0);
}

main().catch(console.error);
