import { db } from '../core/database.js';
import { usuariosAdministrativos, clinicas } from './schema.js';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

async function seed() {
  console.log('🌱 Iniciando seeder...');

  // 1. Crear clínica por defecto
  console.log('Creando clínica por defecto...');
  let clinica = await db.select().from(clinicas).limit(1);
  if (clinica.length === 0) {
    const nuevaClinica = await db.insert(clinicas).values({
      nombre: 'Clínica MedAPP Central',
      telefono: '1122334455'
    }).returning();
    clinica = nuevaClinica;
    console.log('✅ Clínica creada:', clinica[0].id);
  } else {
    console.log('✅ Clínica ya existe:', clinica[0].id);
  }

  // 2. Comprobar si hay un usuario administrador
  console.log('Buscando usuario administrador (la creación depende de Auth)...');
  const adminUsers = await db.select().from(usuariosAdministrativos).limit(1);
  
  if (adminUsers.length === 0) {
    console.log('⚠️ No hay usuarios administrativos. Deberás crear uno desde el Frontend de Supabase Auth.');
  } else {
    console.log('✅ Usuarios administrativos existen:', adminUsers[0].id);
  }

  console.log('🎉 Seed finalizado con éxito.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error ejecutando el seed:', err);
  process.exit(1);
});
