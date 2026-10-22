import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

const PUBLIC_DATABASE_TIMEOUT_MS = 12_000;

// Public-facing pages must render a useful fallback when the database is
// temporarily slow or unavailable, rather than occupying a serverless
// function for minutes. Retain the caller's cancellation signal as well.
const boundedPublicFetch: typeof fetch = (input, init) => {
  const signals: AbortSignal[] = [AbortSignal.timeout(PUBLIC_DATABASE_TIMEOUT_MS)];
  if (input instanceof Request) signals.push(input.signal);
  if (init?.signal) signals.push(init.signal);

  return fetch(input, { ...init, signal: AbortSignal.any(signals) });
};

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
