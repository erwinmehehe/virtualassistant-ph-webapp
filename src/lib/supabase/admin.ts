import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createBoundedSupabaseFetch } from "@/lib/supabase/bounded-fetch";

// Privileged operations should fail promptly if Supabase is unreachable.
const boundedAdminFetch = createBoundedSupabaseFetch(12_000);

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: boundedAdminFetch }, auth: { autoRefreshToken: false, persistSession: false } }
  );
}
