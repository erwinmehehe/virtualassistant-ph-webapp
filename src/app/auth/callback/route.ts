import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { claimClientHiringRequests } from "@/lib/lead-claims";
import { getOrBootstrapProfile } from "@/lib/profile-bootstrap";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = safeNext(url.searchParams.get("next"));
  const lead = url.searchParams.get("lead") || undefined;
  const requestedRole = url.searchParams.get("role");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      let { data: { user } } = await supabase.auth.getUser();
      if (user && (requestedRole === "client" || requestedRole === "va") && !user.user_metadata?.role) {
        const { data } = await supabase.auth.updateUser({ data: { role: requestedRole } });
        user = data.user ?? user;
      }
      const profile = user ? await getOrBootstrapProfile(user) : null;

      if (user?.email_confirmed_at) {
        // Social/OAuth and confirmed email sign-ins should immediately feed the
        // trust signal used by internal/public profile badges.
        await supabase.from("profiles").update({ email_verified: true, last_active_at: new Date().toISOString() }).eq("id", user.id);
      }

      if (!user || !profile) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/auth/login?error=Your%20account%20was%20confirmed%20but%20its%20workspace%20could%20not%20be%20loaded", url.origin));
      }

      if (user.email && lead && profile.role === "client") {
        try {
          const claimedJobId = await claimClientHiringRequests({ userId: user.id, email: user.email, leadId: lead });
          if (claimedJobId) return NextResponse.redirect(new URL(`/workspace/client/jobs/${claimedJobId}?claimed=1`, url.origin));
        } catch {
          // A failed/stale claim must not block a valid authentication callback.
        }
      }

      const fallback = `/workspace/${profile.role}`;
      const next = requestedNext ?? fallback;
      const destination = next.startsWith("/workspace/") && !next.startsWith(fallback) ? fallback : next;
      return NextResponse.redirect(new URL(destination, url.origin));
    }
  }
  return NextResponse.redirect(new URL("/auth/login?error=Authentication%20link%20could%20not%20be%20verified", url.origin));
}
