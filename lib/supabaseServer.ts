// lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!url || !(anon && (service || anon))) {
  console.error("[supabaseServer] Faltan variables de entorno Supabase");
}

/**
 * Cliente ADMIN para rutas server-side (usa service role si está disponible).
 * Lo exportamos con el nombre `supabase` porque así lo importan tus rutas.
 */
export const supabase = createClient(url, service || anon, {
  auth: { persistSession: false },
});

/** Cliente público por si lo necesitás en algún util server-side */
export const supabaseAnon = createClient(url, anon, {
  auth: { persistSession: false },
});

export default supabase;