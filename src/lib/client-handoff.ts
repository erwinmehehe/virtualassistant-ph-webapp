import "server-only";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteOrigin } from "@/lib/seo-url";

type AdminClient = ReturnType<typeof createAdminClient>;

type HandoffFailureReason =
  | "missing_email"
  | "existing_client_missing"
  | "identity_mismatch"
  | "invite_error"
  | "role_conflict"
  | "profile_error"
  | "client_profile_error";

function failure(reason: HandoffFailureReason, blocking = false) {
  return {
    linked: false as const,
    reason,
    blocking,
    actionLink: null as string | null
  };
}

async function findAuthUserByEmail(admin: AdminClient, email: string): Promise<User | null> {
  const wanted = email.trim().toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) return null;
    const found = data.users.find((user) => String(user.email || "").trim().toLowerCase() === wanted);
    if (found) return found;
    if (data.users.length < 100) break;
  }
  return null;
}

async function ensureClientProfile(admin: AdminClient, user: User, lead: any) {
  const { data: existingProfile, error: profileLookupError } = await admin
    .from("profiles")
    .select("id,role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileLookupError) return { ok: false as const, reason: "profile_error" as const };
  if (existingProfile?.role && existingProfile.role !== "client") {
    return { ok: false as const, reason: "role_conflict" as const };
  }

  if (!existingProfile) {
    // user_metadata is intentionally not used for authorization. It is user-editable.
    const { error: profileError } = await admin.from("profiles").insert({
      id: user.id,
      role: "client",
      full_name: lead.name || user.user_metadata?.full_name || null
    });
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

/**
 * Resolve the Auth user that is safe to attach to an accepted hiring request.
 *
 * This function deliberately does not update lead_intake or jobs. Those writes
 * are committed later by accept_lead_proposal_atomic so a proposal can never
 * be half accepted. Auth link generation is outside Postgres and therefore has
 * to happen before that transaction.
 */
export async function ensureAcceptedLeadClientWorkspace(args: {
  lead: any;
  jobId: string;
  existingClientId?: string | null;
}) {
  const admin = createAdminClient();
  const leadEmail = String(args.lead.email || "").trim().toLowerCase();
  if (!leadEmail) return failure("missing_email", true);

  const redirectTo = `${siteOrigin()}/auth/callback?next=${encodeURIComponent(`/workspace/client/jobs/${args.jobId}`)}&lead=${encodeURIComponent(args.lead.id)}&role=client`;
  let user: User | null = null;

  if (args.existingClientId) {
    const { data, error } = await admin.auth.admin.getUserById(args.existingClientId);
    if (error || !data.user) return failure("existing_client_missing", true);
    const existingEmail = String(data.user.email || "").trim().toLowerCase();
    if (!existingEmail || existingEmail !== leadEmail) return failure("identity_mismatch", true);
    user = data.user;
  } else {
    user = await findAuthUserByEmail(admin, leadEmail);
  }

  let actionLink: string | null = null;
  let created = false;

  if (!user) {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "invite",
      email: leadEmail,
      options: {
        data: { role: "client", full_name: args.lead.name || undefined },
        redirectTo
      }
    });
    if (error || !data.user) return failure("invite_error");
    user = data.user;
    actionLink = data.properties?.action_link || null;
    created = true;
  }

  const resolvedEmail = String(user.email || "").trim().toLowerCase();
  if (!resolvedEmail || resolvedEmail !== leadEmail) return failure("identity_mismatch", true);

  const profile = await ensureClientProfile(admin, user, args.lead);
  if (!profile.ok) return failure(profile.reason, profile.reason === "role_conflict");

  if (!created) {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: resolvedEmail,
      options: { redirectTo }
    });
    if (!error) actionLink = data.properties?.action_link || null;
  }

  return {
    linked: true as const,
    userId: user.id,
    email: resolvedEmail,
    actionLink,
    created,
    blocking: false as const
  };
}
