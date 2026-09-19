"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { siteOrigin } from "@/lib/seo-url";
import { sendAccountConfirmationEmail } from "@/lib/email";

function safePath(value: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}

function tokenFromGeneratedActionLink(actionLink: string | undefined | null) {
  if (!actionLink) return null;
  try {
    return new URL(actionLink).searchParams.get("token");
  } catch {
    return null;
  }
}

async function findUnconfirmedUserByEmail(email: string) {
  const admin = createAdminClient();
  const perPage = 1000;
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) return null;
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user.email_confirmed_at ? null : user;
    if (data.users.length < perPage) return null;
  }
  return null;
}

function brandedConfirmationUrl(args: { tokenHash: string; next?: string | null; lead?: string }) {
  const params = new URLSearchParams({
    token_hash: args.tokenHash,
    type: "magiclink",
  });
  if (args.next) params.set("next", args.next);
  if (args.lead) params.set("lead", args.lead);
  return `${siteOrigin()}/auth/confirm?${params.toString()}`;
}

function loginRedirect(params: { error?: string; message?: string; next?: string | null; lead?: string }) {
  const query = new URLSearchParams({ confirm: "1" });
  if (params.error) query.set("error", params.error);
  if (params.message) query.set("message", params.message);
  if (params.next) query.set("next", params.next);
  if (params.lead) query.set("lead", params.lead);
  return `/auth/login?${query.toString()}`;
}

export async function resendSignupConfirmationAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const next = safePath(String(formData.get("next") || "").trim());
  const leadRaw = String(formData.get("lead") || "").trim();
  const lead = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(leadRaw) ? leadRaw : "";
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!validEmail) {
    redirect(loginRedirect({
      error: "Enter the email address you used to create your account.",
      next,
      lead
    }));
  }

  try {
    await enforceActionRateLimit("auth_resend_confirmation", email, 3, 60);
  } catch {
    redirect(loginRedirect({
      message: "If that account still needs confirmation, please wait before requesting another email.",
      next,
      lead
    }));
  }

  let brandedSent = false;
  const unconfirmedUser = await findUnconfirmedUserByEmail(email);

  if (unconfirmedUser) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: siteOrigin() }
      });
      if (!error) {
        const tokenHash = tokenFromGeneratedActionLink(data.properties?.action_link);
        if (tokenHash) {
          const actionUrl = brandedConfirmationUrl({ tokenHash, next, lead });
          const result = await sendAccountConfirmationEmail({ to: email, actionUrl });
          brandedSent = result.sent;
        }
      }
    } catch {
      brandedSent = false;
    }
  }

  if (!brandedSent && unconfirmedUser) {
    const callbackParams = new URLSearchParams();
    if (next) callbackParams.set("next", next);
    if (lead) callbackParams.set("lead", lead);
    const callbackUrl = `${siteOrigin()}/auth/callback${callbackParams.toString() ? `?${callbackParams.toString()}` : ""}`;
    const supabase = await createClient();
    try {
      await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: callbackUrl }
      });
    } catch {
      // Keep the response non-enumerating. The user gets the same message whether
      // the address is unknown, already confirmed, or the provider declined it.
    }
  }

  redirect(loginRedirect({
    message: "If that account still needs confirmation, we sent a new email. Check your inbox and spam folder.",
    next,
    lead
  }));
}
