import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { claimClientHiringRequests } from "@/lib/lead-claims";
import { getOrBootstrapProfile } from "@/lib/profile-bootstrap";
import { recordProductEvent } from "@/lib/product-events";
import { recordSuccessfulLoginAndMaybeAlert } from "@/lib/account-security";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}

function isTrainingPath(value: string | null) {
  return value === "/workspace/training" || Boolean(value?.startsWith("/workspace/training/"));
}

function oauthSignInMethod(provider: unknown) {
  if (provider === "google") return "Google";
  if (provider === "azure") return "Microsoft";
  if (typeof provider === "string" && provider.trim()) {
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  }
  return "Social sign-in";
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
      const trainingDestination = isTrainingPath(requestedNext);
      if (user && trainingDestination && !user.user_metadata?.role && user.user_metadata?.account_type !== "training") {
        const { data } = await supabase.auth.updateUser({ data: { account_type: "training" } });
        user = data.user ?? user;
      }
      const profile = user ? await getOrBootstrapProfile(user) : null;

      if (user?.email_confirmed_at && profile) {
        // Social/OAuth and confirmed email sign-ins should immediately feed the
        // trust signal used by internal/public profile badges.
        await supabase.from("profiles").update({ email_verified: true, last_active_at: new Date().toISOString() }).eq("id", user.id);
      }

      if (!user || (!profile && !trainingDestination)) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/auth/login?error=Your%20account%20was%20confirmed%20but%20its%20workspace%20could%20not%20be%20loaded", url.origin));
      }

      try {
        await recordSuccessfulLoginAndMaybeAlert({
          userId: user.id,
          email: user.email,
          fullName: profile?.full_name || (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null),
          signInMethod: oauthSignInMethod(user.app_metadata?.provider),
        });
      } catch {
        // OAuth sign-in remains available if security-event persistence is temporarily unavailable.
      }

      if (user.email && lead && profile?.role === "client") {
        try {
          const claimedJobId = await claimClientHiringRequests({ userId: user.id, email: user.email, leadId: lead });
          if (claimedJobId) return NextResponse.redirect(new URL(`/workspace/client/jobs/${claimedJobId}?claimed=1`, url.origin));
        } catch {
          // A failed/stale claim must not block a valid authentication callback.
        }
      }

      if (user && trainingDestination) {
    await recordProductEvent("training_email_confirmed", {
      userId: user.id,
      path: requestedNext || "/workspace/training",
      metadata: { confirmation_route: "callback" },
    });
  }

  const fallback = profile ? `/workspace/${profile.role}` : "/workspace/training";
      const next = requestedNext ?? fallback;
      const destination = isTrainingPath(next)
        ? next
        : next.startsWith("/workspace/") && profile && !next.startsWith(fallback)
          ? fallback
          : profile || !next.startsWith("/workspace/")
            ? next
            : "/workspace/training";
      return NextResponse.redirect(new URL(destination, url.origin));
    }
  }
  return NextResponse.redirect(new URL("/auth/login?error=Authentication%20link%20could%20not%20be%20verified", url.origin));
}
