import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check your .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persiste sessão no localStorage (comportamento padrão)
    // A revalidação server-side é feita via getUser() nos guards
    persistSession: true,
    // Auto-refresh do token antes de expirar
    autoRefreshToken: true,
    // Detecta sessão de OAuth no URL (necessário para Google/Twitter login)
    detectSessionInUrl: true,
  },
});
