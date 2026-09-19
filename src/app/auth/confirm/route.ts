import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { claimClientHiringRequests } from "@/lib/lead-claims";
import { getOrBootstrapProfile } from "@/lib/profile-bootstrap";

const ALLOWED_TYPES = new Set<EmailOtpType>(["signup", "recovery"]);

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = safeNext(url.searchParams.get("next"));
  const lead = url.searchParams.get("lead") || undefined;

  if (!tokenHash || !type || !ALLOWED_TYPES.has(type)) {
    return NextResponse.redirect(new URL("/auth/login?error=Authentication%20link%20is%20invalid", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) {
    return NextResponse.redirect(new URL("/auth/login?error=Authentication%20link%20could%20not%20be%20verified", url.origin));
  }

  if (type === "recovery") {
    return NextResponse.redirect(new URL(requestedNext || "/auth/update-password", url.origin));
  }

  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getOrBootstrapProfile(user) : null;
  if (!user || !profile) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/auth/login?error=Your%20account%20was%20confirmed%20but%20its%20workspace%20could%20not%20be%20loaded", url.origin));
  }

  await supabase
    .from("profiles")
    .update({ email_verified: true, last_active_at: new Date().toISOString() })
    .eq("id", user.id);

  if (user.email && lead && profile.role === "client") {
    try {
      const claimedJobId = await claimClientHiringRequests({ userId: user.id, email: user.email, leadId: lead });
      if (claimedJobId) {
        return NextResponse.redirect(new URL(`/workspace/client/jobs/${claimedJobId}?claimed=1`, url.origin));
      }
    } catch {
      // A stale or already-claimed hiring request must not block account confirmation.
    }
  }

  const fallback = `/workspace/${profile.role}`;
  const next = requestedNext ?? fallback;
  const destination = next.startsWith("/workspace/") && !next.startsWith(fallback) ? fallback : next;
  return NextResponse.redirect(new URL(destination, url.origin));
}
