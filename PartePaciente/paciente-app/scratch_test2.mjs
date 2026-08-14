import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: clinicas } = await supabase.from('clinicas').select('id, nombre');
  console.log("CLINICAS:", clinicas);
  
  const { data: especialidades } = await supabase.from('especialidades').select('*');
  console.log("ESPECIALIDADES:", especialidades);
}
check();
