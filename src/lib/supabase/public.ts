import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Cookie-free Supabase client for data that is deliberately public through
 * RLS/views. Use this instead of the session-aware SSR client on cacheable
 * marketing pages so public rendering never becomes user-specific.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
}
