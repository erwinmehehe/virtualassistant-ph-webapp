import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createBoundedSupabaseFetch } from "@/lib/supabase/bounded-fetch";

// Authentication refresh must not block routing for 25 seconds.
const boundedMiddlewareFetch = createBoundedSupabaseFetch(4_000);


function normalizeRequestHost(value: string | null) {
  return value?.split(",")[0]?.trim().replace(/:\d+$/, "").toLowerCase() ?? null;
}

// Public course discovery is separate from the authenticated learner workspace.
function publicTrainingBrowseRedirect(request: NextRequest) {
  const destination = request.nextUrl.clone();
  destination.pathname = "/training";
  destination.search = "";
  destination.hash = "course-library";
  return NextResponse.redirect(destination, 307);
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

  const isPublicBrowseRequest = request.nextUrl.pathname === "/workspace/training" &&
    request.nextUrl.searchParams.get("browse") === "1";

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
  if (!hasSupabaseSession) {
    if (isPublicBrowseRequest) return publicTrainingBrowseRedirect(request);
    return response;
  }

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
  let sessionVerified = false;
  try {
    const { data, error } = await supabase.auth.getClaims();
    sessionVerified = !error && Boolean(data?.claims?.sub);
  } catch {
    // This is only a session refresh. Server-side route guards still enforce
    // authentication and authorization; do not trust this fallback for access.
  }
  // Stale cookies should not force a visitor to log in merely to browse courses.
  if (isPublicBrowseRequest && !sessionVerified) return publicTrainingBrowseRedirect(request);
  return response;
}

export const config = {
  matcher: ["/((?!api/analytics|api/errors|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
