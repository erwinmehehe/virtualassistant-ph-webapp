import "server-only";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { claimClientHiringRequests } from "@/lib/lead-claims";
import { siteOrigin } from "@/lib/seo-url";

type AdminClient = ReturnType<typeof createAdminClient>;

async function findAuthUserByEmail(admin: AdminClient, email: string): Promise<User | null> {
  const wanted = email.trim().toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) return null;
    const found = data.users.find((user) => String(user.email || "").toLowerCase() === wanted);
    if (found) return found;
    if (data.users.length < 100) break;
  }
  return null;
}

async function ensureClientProfile(admin: AdminClient, user: User, lead: any) {
  const { data: existingProfile } = await admin.from("profiles").select("id,role").eq("id", user.id).maybeSingle();
  if (existingProfile?.role && existingProfile.role !== "client") {
    return { ok: false as const, reason: "role_conflict" as const };
  }

  if (!existingProfile) {
    const metadataRole = user.user_metadata?.role;
    if (metadataRole && metadataRole !== "client") {
      return { ok: false as const, reason: "role_conflict" as const };
    }
    const { error: profileError } = await admin.from("profiles").upsert({
      id: user.id,
      role: "client",
      full_name: lead.name || user.user_metadata?.full_name || null
    }, { onConflict: "id" });
    if (profileError) return { ok: false as const, reason: "profile_error" as const };
  }

  const { error: clientError } = await admin.from("client_profiles").upsert({
    user_id: user.id,
    company_name: lead.company || null,
    timezone: lead.timezone || null,
    hiring_needs: lead.message || lead.service || null
  }, { onConflict: "user_id" });
  if (clientError) return { ok: false as const, reason: "client_profile_error" as const };

  return { ok: true as const };
}

export async function ensureAcceptedLeadClientWorkspace(args: {
  lead: any;
  jobId: string;
  existingClientId?: string | null;
}) {
  const admin = createAdminClient();
  const email = String(args.lead.email || "").trim().toLowerCase();
  if (!email) return { linked: false as const, reason: "missing_email" as const, actionLink: null as string | null };

  const redirectTo = `${siteOrigin()}/auth/callback?next=${encodeURIComponent(`/workspace/client/jobs/${args.jobId}`)}&lead=${encodeURIComponent(args.lead.id)}&role=client`;
  let user: User | null = null;
  if (args.existingClientId) {
    const { data } = await admin.auth.admin.getUserById(args.existingClientId);
    user = data.user || null;
  }
  if (!user) user = await findAuthUserByEmail(admin, email);
  let actionLink: string | null = null;
  let created = false;

  if (!user) {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        data: { role: "client", full_name: args.lead.name || undefined },
        redirectTo
      }
    });
    if (error || !data.user) {
      return { linked: false as const, reason: "invite_error" as const, actionLink: null as string | null };
    }
    user = data.user;
    actionLink = data.properties?.action_link || null;
    created = true;
  }

  const profile = await ensureClientProfile(admin, user, args.lead);
  if (!profile.ok) {
    return { linked: false as const, reason: profile.reason, actionLink: null as string | null };
  }

  if (!created) {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo }
    });
    if (!error) actionLink = data.properties?.action_link || null;
  }

  await Promise.all([
    admin.from("lead_intake").update({ client_id: user.id }).eq("id", args.lead.id),
    admin.from("jobs").update({ client_id: user.id }).eq("id", args.jobId)
  ]);

  try {
    await claimClientHiringRequests({ userId: user.id, email, leadId: args.lead.id });
  } catch {
    // The current accepted lead/job is already linked above. Related older
    // leads are a convenience and must not block the handoff.
  }

  return {
    linked: true as const,
    userId: user.id,
    actionLink,
    created
  };
}
