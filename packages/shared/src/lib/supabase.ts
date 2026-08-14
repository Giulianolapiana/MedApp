import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan las variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. " +
    "Revisá tu archivo .env en la raíz del proyecto."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
