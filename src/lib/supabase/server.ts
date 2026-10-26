import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createBoundedSupabaseFetch } from "@/lib/supabase/bounded-fetch";

const boundedSessionFetch = createBoundedSupabaseFetch(12_000);


export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: boundedSessionFetch },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet, _headers) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Components cannot always write cookies. Middleware refreshes sessions.
          }
        }
      }
    }
  );
}
