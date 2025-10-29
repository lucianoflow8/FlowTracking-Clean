// lib/supabaseAdmin.js
import { createClient } from "@supabase/supabase-js";

export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

  if (!url || !key) {
    throw new Error("Missing Supabase envs (URL/Service Role)");
  }

  return createClient(url, key, { auth: { persistSession: false } });
}