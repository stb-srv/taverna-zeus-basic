import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Service-role Supabase client for privileged operations (managing auth users).
 * SERVER-ONLY: uses the secret service_role key, which bypasses RLS. Never import
 * this from client components. The key must be set as SUPABASE_SERVICE_ROLE_KEY
 * (no NEXT_PUBLIC_ prefix, so it is never sent to the browser).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY fehlt. Bitte das service_role-Secret aus Supabase → Project Settings → API in .env.local eintragen.",
    );
  }
  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
