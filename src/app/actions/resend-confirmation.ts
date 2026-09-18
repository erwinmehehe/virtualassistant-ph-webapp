"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { siteOrigin } from "@/lib/seo-url";

function safePath(value: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
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

  redirect(loginRedirect({
    message: "If that account still needs confirmation, we sent a new email. Check your inbox and spam folder.",
    next,
    lead
  }));
}
