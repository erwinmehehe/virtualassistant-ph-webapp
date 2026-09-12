import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrBootstrapProfile } from "@/lib/profile-bootstrap";
import { withServerTiming } from "@/lib/server-timing";
import type { Role } from "./types";

// Deduped per request: a workspace route resolves this in its layout AND its
// page, and without cache() that is two auth.getUser() round trips, two profile
// selects, and a duplicated last_active_at write on every navigation.
export const getSessionProfile = cache(async function getSessionProfile() {
  return withServerTiming("auth.session", async () => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { user: null, profile: null };

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role, full_name, avatar_url, account_status, email_verified, last_active_at")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        if (profile.account_status === "banned") {
          await supabase.auth.signOut();
          return { user: null, profile: null, banned: true as const };
        }

        const lastActiveMs = profile.last_active_at ? new Date(profile.last_active_at).getTime() : 0;
        const shouldRefreshActivity = !lastActiveMs || Date.now() - lastActiveMs > 6 * 60 * 60 * 1000;
        const shouldConfirmEmail = Boolean(user.email_confirmed_at) && !profile.email_verified;
        if (shouldRefreshActivity || shouldConfirmEmail) {
          const patch: Record<string, string | boolean> = {};
          if (shouldRefreshActivity) patch.last_active_at = new Date().toISOString();
          if (shouldConfirmEmail) patch.email_verified = true;
          await supabase.from("profiles").update(patch).eq("id", user.id);
        }
        return { user, profile };
      }

      const repairedProfile = await getOrBootstrapProfile(user);
      return { user, profile: repairedProfile };
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[auth] getSessionProfile falling back to logged-out:", (err as Error).message);
      }
      return { user: null, profile: null };
    }
  });
});

export async function requireRole(role: Role) {
  const session = await getSessionProfile();
  if ("banned" in session && session.banned) redirect("/auth/login?error=Your%20account%20has%20been%20suspended.%20Contact%20support%20if%20you%20believe%20this%20is%20a%20mistake.");
  if (!session.user) redirect(`/auth/login?next=/workspace/${role}`);
  if (!session.profile || session.profile.role !== role) {
    const actual = session.profile?.role;
    if (actual) redirect(`/workspace/${actual}`);
    redirect("/auth/login?error=Your%20account%20is%20signed%20in%20but%20its%20workspace%20role%20is%20not%20configured");
  }
  return session as typeof session & { user: NonNullable<typeof session.user>; profile: NonNullable<typeof session.profile> };
}

export async function requireAnyRole(roles: Role[]) {
  const session = await getSessionProfile();
  if ("banned" in session && session.banned) redirect("/auth/login?error=Your%20account%20has%20been%20suspended.%20Contact%20support%20if%20you%20believe%20this%20is%20a%20mistake.");
  if (!session.user) redirect("/auth/login");
  if (!session.profile || !roles.includes(session.profile.role as Role)) {
    const actual = session.profile?.role;
    if (actual) redirect(`/workspace/${actual}`);
    redirect("/auth/login?error=Your%20account%20is%20signed%20in%20but%20its%20workspace%20role%20is%20not%20configured");
  }
  return session as typeof session & { user: NonNullable<typeof session.user>; profile: NonNullable<typeof session.profile> };
}
