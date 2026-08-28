import "server-only";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, Role } from "@/lib/types";

const ROLES: Role[] = ["client", "va", "recruiter", "admin"];

function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLES.includes(value as Role);
}

function bootstrapRole(user: User): Role | null {
  // app_metadata is server-controlled, so it may safely carry privileged roles.
  const appRole = user.app_metadata?.role;
  if (isRole(appRole)) return appRole;

  // user_metadata is user-editable. Only allow the two public signup roles here.
  const userRole = user.user_metadata?.role;
  if (userRole === "client" || userRole === "va") return userRole;
  return null;
}

function bootstrapName(user: User) {
  const value = user.user_metadata?.full_name ?? user.user_metadata?.name;
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 100) : null;
}

/**
 * Returns the authoritative workspace profile for an authenticated user.
 * If an older account is missing its public profile row, repair it from the
 * signup metadata so a successful login never falls through to the homepage.
 */
export async function getOrBootstrapProfile(user: User): Promise<Profile | null> {
  try {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("profiles")
      .select("id, role, full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (existing) return existing as Profile;

    const role = bootstrapRole(user);
    if (!role) return null;

    const { data: created, error } = await admin
      .from("profiles")
      .upsert({ id: user.id, role, full_name: bootstrapName(user) }, { onConflict: "id", ignoreDuplicates: true })
      .select("id, role, full_name, avatar_url")
      .single();

    if (error || !created) {
      const { data: racedProfile } = await admin
        .from("profiles")
        .select("id, role, full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (!racedProfile) return null;
      return racedProfile as Profile;
    }

    if (role === "client") {
      await admin.from("client_profiles").upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });
    } else if (role === "va") {
      await admin.from("va_profiles").upsert(
        { user_id: user.id, slug: `va-${user.id.slice(0, 8)}` },
        { onConflict: "user_id", ignoreDuplicates: true }
      );
      await admin.from("va_vetting").upsert({ va_id: user.id }, { onConflict: "va_id", ignoreDuplicates: true });
    }

    return created as Profile;
  } catch {
    return null;
  }
}
