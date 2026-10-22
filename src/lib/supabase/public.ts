import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createBoundedSupabaseFetch } from "@/lib/supabase/bounded-fetch";

let cachedClient: SupabaseClient | null = null;

const boundedPublicFetch = createBoundedSupabaseFetch(12_000);

export function createPublicClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;

  cachedClient = createClient(url, anonKey, {
    global: { fetch: boundedPublicFetch },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  return cachedClient;
}
