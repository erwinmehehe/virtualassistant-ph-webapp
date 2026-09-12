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

async function ensureRoleRows(admin: ReturnType<typeof createAdminClient>, user: User, role: Role) {
  if (role === "client") {
    const { error } = await admin.from("client_profiles").upsert(
      { user_id: user.id },
      { onConflict: "user_id", ignoreDuplicates: true }
    );
    if (error) throw error;
    return;
  }

  if (role === "va") {
    const { error: vaError } = await admin.from("va_profiles").upsert(
      { user_id: user.id, slug: `va-${user.id.slice(0, 8)}` },
      { onConflict: "user_id", ignoreDuplicates: true }
    );
    if (vaError) throw vaError;

    const { error: vettingError } = await admin.from("va_vetting").upsert(
      { va_id: user.id },
      { onConflict: "va_id", ignoreDuplicates: true }
    );
    if (vettingError) throw vettingError;
  }
}

/**
 * Returns the authoritative workspace profile for an authenticated user.
 * If an older account is missing its profile or role-specific child rows,
 * repair them so a successful login always lands in a usable workspace.
 */
export async function getOrBootstrapProfile(user: User): Promise<Profile | null> {
  try {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("profiles")
      .select("id, role, full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (existing) {
      const role = isRole(existing.role) ? existing.role : null;
      if (!role) return null;
      await ensureRoleRows(admin, user, role);
      return existing as Profile;
    }

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
      if (!racedProfile || !isRole(racedProfile.role)) return null;
      await ensureRoleRows(admin, user, racedProfile.role);
      return racedProfile as Profile;
    }

    await ensureRoleRows(admin, user, role);
    return created as Profile;
  } catch {
    return null;
  }
}
