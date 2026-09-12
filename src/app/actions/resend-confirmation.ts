"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { siteOrigin } from "@/lib/seo-url";

export async function resendSignupConfirmationAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!validEmail) redirect("/auth/login?error=Enter%20the%20email%20address%20you%20used%20to%20create%20your%20account");

  try {
    await enforceActionRateLimit("auth_resend_confirmation", email, 3, 60);
  } catch {
    redirect("/auth/login?message=If%20that%20account%20still%20needs%20confirmation%2C%20please%20wait%20before%20requesting%20another%20email.");
  }

  const supabase = await createClient();
  try {
    await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${siteOrigin()}/auth/callback?next=/workspace/va/onboarding` }
    });
  } catch {
    // Keep the response non-enumerating. The user gets the same message whether
    // the address is unknown, already confirmed, or the provider declined it.
  }

  redirect("/auth/login?message=If%20that%20account%20still%20needs%20confirmation%2C%20we%20sent%20a%20new%20email.%20Check%20your%20inbox%20and%20spam%20folder.");
}
