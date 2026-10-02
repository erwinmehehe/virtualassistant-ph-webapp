"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAnyRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAdminAudit } from "@/lib/admin-audit";

function normalizeEmail(value: FormDataEntryValue | null) {
  const email = String(value || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Add a valid email address.");
  }
  return email.slice(0, 254);
}

function normalizeName(value: FormDataEntryValue | null) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  if (!name) throw new Error("Add the recruiter's name.");
  return name.slice(0, 100);
}

function siteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim()
    || process.env.NEXT_PUBLIC_APP_URL?.trim()
    || "https://virtualassistant.com.ph";
  return raw.replace(/\/$/, "");
}

function returnPath(role: "admin" | "recruiter", status: "sent" | "granted" | "exists") {
  if (role === "recruiter") return `/workspace/recruiter/team?recruiter_invite=${status}`;
  return status === "granted"
    ? "/workspace/admin/users?recruiter_access=granted"
    : `/workspace/admin/users?recruiter_invite=${status}`;
}

async function findAuthUserByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
) {
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;

    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < 200) break;
  }
  return null;
}

export async function inviteRecruiterAction(formData: FormData) {
  const session = await requireAnyRoleFast(["admin", "recruiter"]);
  const actorRole = session.profile.role as "admin" | "recruiter";
  const email = normalizeEmail(formData.get("email"));
  const fullName = normalizeName(formData.get("full_name"));
  const admin = createAdminClient();

  const existingUser = await findAuthUserByEmail(admin, email);

  if (existingUser) {
    const { data: existingProfile, error: profileLoadError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", existingUser.id)
      .maybeSingle();

    if (profileLoadError) throw profileLoadError;
    const existingRole = existingProfile?.role || existingUser.app_metadata?.role || null;

    if (existingRole === "admin") {
      throw new Error("This email already belongs to an Admin account.");
    }

    if (existingRole === "recruiter") {
      revalidatePath("/workspace/recruiter/team");
      redirect(returnPath(actorRole, "exists"));
    }

    if (actorRole !== "admin") {
      throw new Error("This email already has a VAPH account. Ask an Admin to change an existing account to Recruiter.");
    }

    const { error: authError } = await admin.auth.admin.updateUserById(existingUser.id, {
      app_metadata: {
        ...(existingUser.app_metadata || {}),
        role: "recruiter",
      },
      user_metadata: {
        ...(existingUser.user_metadata || {}),
        full_name: fullName,
      },
    });
    if (authError) throw authError;

    const { error: profileError } = await admin.from("profiles").upsert({
      id: existingUser.id,
      role: "recruiter",
      full_name: fullName,
      email_verified: Boolean(existingUser.email_confirmed_at),
    }, { onConflict: "id" });
    if (profileError) throw profileError;

    await writeAdminAudit({
      actorId: session.userId,
      action: "recruiter_access_granted",
      targetType: "user",
      targetId: existingUser.id,
      metadata: { email, full_name: fullName, source: "admin_users_invite", actor_role: actorRole },
    });

    revalidatePath("/workspace/admin/users");
    revalidatePath("/workspace/recruiter/team");
    redirect(returnPath(actorRole, "granted"));
  }

  const redirectTo = `${siteUrl()}/auth/callback?next=%2Fworkspace%2Frecruiter%2Ftoday`;
  const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      role: "recruiter",
    },
    redirectTo,
  });

  if (inviteError) throw inviteError;
  if (!data.user) throw new Error("The recruiter invitation could not be created.");

  const invitedUser = data.user;

  const { error: authRoleError } = await admin.auth.admin.updateUserById(invitedUser.id, {
    app_metadata: {
      ...(invitedUser.app_metadata || {}),
      role: "recruiter",
    },
    user_metadata: {
      ...(invitedUser.user_metadata || {}),
      full_name: fullName,
      role: "recruiter",
    },
  });
  if (authRoleError) throw authRoleError;

  const { error: profileError } = await admin.from("profiles").upsert({
    id: invitedUser.id,
    role: "recruiter",
    full_name: fullName,
    email_verified: Boolean(invitedUser.email_confirmed_at),
  }, { onConflict: "id" });
  if (profileError) throw profileError;

  await writeAdminAudit({
    actorId: session.userId,
    action: "recruiter_invited",
    targetType: "user",
    targetId: invitedUser.id,
    metadata: { email, full_name: fullName, source: actorRole === "admin" ? "admin_users_invite" : "recruiter_team_invite", actor_role: actorRole },
  });

  revalidatePath("/workspace/admin/users");
  revalidatePath("/workspace/recruiter/team");
  redirect(returnPath(actorRole, "sent"));
}
