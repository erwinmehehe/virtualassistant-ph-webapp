import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createBoundedSupabaseFetch } from "@/lib/supabase/bounded-fetch";

// Authentication refresh must not block routing for 25 seconds.
const boundedMiddlewareFetch = createBoundedSupabaseFetch(4_000);


function normalizeRequestHost(value: string | null) {
  return value?.split(",")[0]?.trim().replace(/:\d+$/, "").toLowerCase() ?? null;
}

export async function middleware(request: NextRequest) {
  const forwardedHost = normalizeRequestHost(request.headers.get("x-forwarded-host"));
  const host = normalizeRequestHost(request.headers.get("host"));
  const nextUrlHost = request.nextUrl.hostname.toLowerCase();
  const hasLegacyHost = [forwardedHost, host, nextUrlHost].includes("www.virtualassistant.com.ph");
  const hasServiceTrailingSlash =
    request.nextUrl.pathname.startsWith("/service/") &&
    request.nextUrl.pathname.length > "/service/".length &&
    request.nextUrl.pathname.endsWith("/");

  if (hasLegacyHost || hasServiceTrailingSlash) {
    const canonicalUrl = request.nextUrl.clone();
    if (hasLegacyHost) {
      canonicalUrl.protocol = "https:";
      canonicalUrl.hostname = "virtualassistant.com.ph";
      canonicalUrl.port = "";
    }
    if (hasServiceTrailingSlash) {
      canonicalUrl.pathname = canonicalUrl.pathname.replace(/\/+$/, "");
    }
    return NextResponse.redirect(canonicalUrl, 308);
  }

  let response = NextResponse.next({ request });

  // These responses are public and intentionally identical for every user.
  // Preserve the canonical-host redirect above, but do not refresh sessions
  // merely to serve cached training content or public social images.
  if (request.nextUrl.pathname === "/training" || request.nextUrl.pathname === "/api/og") {
    return response;
  }

  // Public visitors and crawlers do not need an auth refresh. Supabase SSR
  // session cookies are named sb-<project-ref>-auth-token (and may be split
  // into numbered chunks), so only create the auth client when one exists.
  // Signed-in visitors still get the normal refresh path on public pages.
  const hasSupabaseSession = request.cookies.getAll().some(({ name }) =>
    name.startsWith("sb-") && name.includes("-auth-token")
  );
  if (!hasSupabaseSession) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: boundedMiddlewareFetch },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        }
      }
    }
  );
  try {
    await supabase.auth.getClaims();
  } catch {
    // This is only a session refresh. Server-side route guards still enforce
    // authentication and authorization; do not trust this fallback for access.
  }
  return response;
}

// Keep routing compute off public, cached pages. Account/session refresh happens
// only where it is required; canonical WWW redirects are deployed via vercel.json.
export const config = {
  matcher: ["/workspace/:path*", "/auth/:path*"],
};
