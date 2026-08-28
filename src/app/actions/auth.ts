"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { claimClientHiringRequests } from "@/lib/lead-claims";
import { getOrBootstrapProfile } from "@/lib/profile-bootstrap";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  next: z.string().optional(),
  lead: z.string().uuid().optional()
});


const oauthSchema = z.object({
  provider: z.enum(["google", "azure"]),
  role: z.enum(["client", "va"]).optional(),
  next: z.string().optional(),
  talent: z.string().max(160).optional(),
  lead: z.string().uuid().optional()
});

const joinSchema = loginSchema.extend({
  full_name: z.string().min(2).max(100),
  role: z.enum(["client", "va"]),
  talent: z.string().max(160).optional(),
  lead: z.string().uuid().optional()
});

function safePath(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

function destinationFor(role: "client" | "va", next?: string, talent?: string) {
  if (role === "client" && talent) return `/workspace/client?talent=${encodeURIComponent(talent)}`;
  return safePath(next, `/workspace/${role}`);
}

function joinErrorPath(role: "client" | "va", message: string, extras?: { talent?: string; lead?: string; next?: string }) {
  const params = new URLSearchParams({ error: message });
  if (extras?.talent) params.set("talent", extras.talent);
  if (extras?.lead) params.set("lead", extras.lead);
  if (extras?.next) params.set("next", extras.next);
  return `/auth/join/${role}?${params.toString()}`;
}

export async function oauthAction(formData: FormData) {
  const parsed = oauthSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/auth/login?error=Could%20not%20start%20social%20login");

  const role = parsed.data.role;
  const destination = role ? destinationFor(role, parsed.data.next, parsed.data.talent) : safePath(parsed.data.next, "/");
  const callbackParams = new URLSearchParams({ next: destination });
  if (role) callbackParams.set("role", role);
  if (role === "client" && parsed.data.lead) callbackParams.set("lead", parsed.data.lead);
  // A missing NEXT_PUBLIC_APP_URL in production silently sends users to
  // localhost after they authenticate with Google/Microsoft: the provider
  // succeeds, the browser lands nowhere, and it reads as "SSO is broken".
  // Fail loudly here instead of handing out a dead redirect.
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "";
  const appUrlIsLocal = !configuredAppUrl || /localhost|127\.0\.0\.1/i.test(configuredAppUrl);
  if (process.env.NODE_ENV === "production" && appUrlIsLocal) {
    redirect("/auth/login?error=Social%20login%20is%20not%20configured%20on%20this%20deployment%20yet.%20Use%20email%20and%20password%2C%20or%20contact%20support.");
  }
  const callback = `${configuredAppUrl || "http://localhost:3000"}/auth/callback?${callbackParams.toString()}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: parsed.data.provider,
    options: {
      redirectTo: callback,
      scopes: parsed.data.provider === "azure" ? "email openid profile" : undefined
    }
  });
  if (error || !data.url) redirect(`/auth/login?error=${encodeURIComponent(error?.message || "Could not start social login")}`);
  redirect(data.url);
}

export async function loginAction(formData: FormData) {
  const rawEmail = String(formData.get("email") || "").trim().toLowerCase();
  await enforceActionRateLimit("auth_login", rawEmail, 8, 15);
  if (!(await verifyTurnstile(formData))) redirect("/auth/login?error=Please%20complete%20the%20security%20check");
  const rawNext = String(formData.get("next") || "").trim();
  const rawLead = String(formData.get("lead") || "").trim();
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const params = new URLSearchParams({ error: "Please check your email and password" });
    if (rawNext) params.set("next", rawNext);
    if (rawLead) params.set("lead", rawLead);
    redirect(`/auth/login?${params.toString()}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) {
    const params = new URLSearchParams({ error: error.message });
    if (parsed.data.next) params.set("next", parsed.data.next);
    if (parsed.data.lead) params.set("lead", parsed.data.lead);
    redirect(`/auth/login?${params.toString()}`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getOrBootstrapProfile(user) : null;
  if (!user || !profile) {
    await supabase.auth.signOut();
    redirect("/auth/login?error=Your%20account%20was%20authenticated%20but%20its%20workspace%20could%20not%20be%20loaded.%20Please%20try%20again%20or%20contact%20support.");
  }
  const fallback = `/workspace/${profile.role}`;
  const requested = safePath(parsed.data.next, fallback);
  if (requested.startsWith("/workspace/") && profile?.role && !requested.startsWith(`/workspace/${profile.role}`)) redirect(fallback);
  let claimedJobId: string | null = null;
  if (profile?.role === "client" && parsed.data.lead && user?.email) {
    try {
      claimedJobId = await claimClientHiringRequests({ userId: user.id, email: user.email, leadId: parsed.data.lead });
    } catch {
      // Login must still succeed if a stale lead cannot be claimed.
    }
  }
  if (claimedJobId) redirect(`/workspace/client/jobs/${claimedJobId}?claimed=1`);
  redirect(requested);
}

export async function joinAction(formData: FormData) {
  const rawEmailForLimit = String(formData.get("email") || "").trim().toLowerCase();
  await enforceActionRateLimit("auth_join", rawEmailForLimit, 5, 60);
  if (!(await verifyTurnstile(formData))) {
    const roleForError = String(formData.get("role")) === "client" ? "client" : "va";
    redirect(joinErrorPath(roleForError, "Please complete the security check"));
  }
  const rawRole = String(formData.get("role") || "");
  const role = rawRole === "client" ? "client" : "va";
  const talent = String(formData.get("talent") || "").trim() || undefined;
  const lead = String(formData.get("lead") || "").trim() || undefined;
  const next = String(formData.get("next") || "").trim() || undefined;
  const parsed = joinSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(joinErrorPath(role, "Please complete all required fields", { talent, lead, next }));
  }

  const avatar = formData.get("avatar");
  if (parsed.data.role === "va") {
    if (!(avatar instanceof File) || avatar.size <= 0) redirect(joinErrorPath("va", "A profile photo is required to create a VA account", { next }));
    if (avatar.size > 3 * 1024 * 1024) redirect(joinErrorPath("va", "Profile photo must be 3 MB or smaller", { next }));
    if (!["image/jpeg", "image/png", "image/webp"].includes(avatar.type)) redirect(joinErrorPath("va", "Upload a JPG, PNG, or WEBP profile photo", { next }));
  }

  const destination = destinationFor(parsed.data.role, parsed.data.next, parsed.data.talent);
  const supabase = await createClient();
  const callbackParams = new URLSearchParams({ next: destination });
  if (parsed.data.role === "client" && parsed.data.lead) callbackParams.set("lead", parsed.data.lead);
  const callback = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback?${callbackParams.toString()}`;
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: callback,
      data: { role: parsed.data.role, full_name: parsed.data.full_name }
    }
  });

  if (error) redirect(joinErrorPath(parsed.data.role, error.message, { talent: parsed.data.talent, lead: parsed.data.lead, next: parsed.data.next }));

  let claimedJobId: string | null = null;
  const accountWasCreated = Boolean(data.user && (data.user.identities?.length ?? 0) > 0);
  if (data.user && accountWasCreated) {
    const admin = createAdminClient();
    if (parsed.data.role === "va" && avatar instanceof File && avatar.size > 0) {
      const extension = avatar.type === "image/png" ? "png" : avatar.type === "image/webp" ? "webp" : "jpg";
      const path = `${data.user.id}/registration-${Date.now()}.${extension}`;
      const { error: uploadError } = await admin.storage.from("avatars").upload(path, avatar, { upsert: false, contentType: avatar.type });
      if (uploadError) {
        await admin.auth.admin.deleteUser(data.user.id);
        redirect(joinErrorPath("va", "We could not save your profile photo. Please try again.", { next }));
      }
      const { data: publicUrl } = admin.storage.from("avatars").getPublicUrl(path);
      const { error: avatarError } = await admin.from("profiles").update({ avatar_url: publicUrl.publicUrl }).eq("id", data.user.id);
      if (avatarError) {
        await admin.storage.from("avatars").remove([path]);
        await admin.auth.admin.deleteUser(data.user.id);
        redirect(joinErrorPath("va", "We could not attach your profile photo. Please try again.", { next }));
      }
    }
    try {
      await admin.from("analytics_events").insert({
        event_name: "account_created",
        path: `/auth/join/${parsed.data.role}`,
        user_id: data.user.id,
        metadata: { role: parsed.data.role, requested_talent: Boolean(parsed.data.talent), claimed_lead: Boolean(parsed.data.lead) }
      });
      if (parsed.data.role === "client" && data.session) {
        claimedJobId = await claimClientHiringRequests({ userId: data.user.id, email: parsed.data.email, leadId: parsed.data.lead });
      }
    } catch {
      // Analytics or lead-claiming failures must not block a valid signup.
    }
  }

  const postSignupDestination = claimedJobId ? `/workspace/client/jobs/${claimedJobId}?claimed=1` : destination;
  if (!data.session) {
    const loginParams = new URLSearchParams({
      message: accountWasCreated ? "Check your email to confirm your account" : "An account may already exist for this email. Log in to continue.",
      next: postSignupDestination
    });
    if (parsed.data.lead) loginParams.set("lead", parsed.data.lead);
    redirect(`/auth/login?${loginParams.toString()}`);
  }
  redirect(postSignupDestination);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  await enforceActionRateLimit("password_reset", email, 4, 60);
  const supabase = await createClient();
  if (email) await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback?next=/auth/update-password` });
  redirect("/auth/login?message=If%20that%20email%20exists,%20a%20reset%20link%20has%20been%20sent");
}

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) redirect("/auth/update-password?error=Password%20must%20be%20at%20least%208%20characters");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/auth/update-password?error=${encodeURIComponent(error.message)}`);
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getOrBootstrapProfile(user) : null;
  if (user?.email) { try { const { sendTransactionalEventEmail } = await import("@/lib/email"); await sendTransactionalEventEmail({ to: user.email, subject: "Your password was changed", heading: "Password updated", body: "The password for your VirtualAssistant.com.ph account was changed. If you did not do this, contact support immediately." }); } catch {} }
  redirect(profile?.role ? `/workspace/${profile.role}` : "/auth/login?error=Your%20workspace%20role%20could%20not%20be%20loaded");
}
