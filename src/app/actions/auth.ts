"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordProductEvent } from "@/lib/product-events";
import { claimClientHiringRequests } from "@/lib/lead-claims";
import { getOrBootstrapProfile } from "@/lib/profile-bootstrap";
import { enforceEmailAndIpRateLimit } from "@/lib/rate-limit";
import { siteOrigin } from "@/lib/seo-url";
import { socialProviderEnabled } from "@/lib/social-login";
import { isDisposableEmail } from "@/lib/disposable-email";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendAccountConfirmationEmail, sendPasswordRecoveryEmail } from "@/lib/email";
import { recordSuccessfulLoginAndMaybeAlert } from "@/lib/account-security";
import { isKnownCompromisedPassword } from "@/lib/pwned-password";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  next: z.string().optional(),
  lead: z.string().uuid().optional()
});

const COMMON_PASSWORD_PARTS = ["password", "qwerty", "letmein", "welcome", "admin", "iloveyou", "123456"];

const newPasswordSchema = z.string()
  .min(12)
  .max(128)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/)
  .regex(/[^A-Za-z0-9]/)
  .refine((value) => !COMMON_PASSWORD_PARTS.some((part) => value.toLowerCase().includes(part)));

const oauthSchema = z.object({
  provider: z.enum(["google", "azure"]),
  role: z.enum(["client", "va"]).optional(),
  next: z.string().optional(),
  talent: z.string().max(160).optional(),
  lead: z.string().uuid().optional()
});

const joinSchema = loginSchema.extend({
  password: newPasswordSchema,
  full_name: z.string().min(2).max(100),
  role: z.enum(["client", "va"]),
  talent: z.string().max(160).optional(),
  lead: z.string().uuid().optional()
});

function safePath(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

function isTrainingPath(value: string | undefined | null) {
  return value === "/workspace/training" || Boolean(value?.startsWith("/workspace/training/"));
}

function destinationFor(role: "client" | "va", next?: string, talent?: string) {
  if (role === "client" && talent) return `/workspace/client?talent=${encodeURIComponent(talent)}`;
  const fallback = role === "va" ? "/workspace/va/onboarding" : `/workspace/${role}`;
  return safePath(next, fallback);
}

function joinErrorPath(role: "client" | "va", message: string, extras?: { talent?: string; lead?: string; next?: string }) {
  const params = new URLSearchParams({ error: message });
  if (extras?.talent) params.set("talent", extras.talent);
  if (extras?.lead) params.set("lead", extras.lead);
  if (extras?.next) params.set("next", extras.next);
  return `/auth/join/${role}?${params.toString()}`;
}

function joinValidationMessage(error: z.ZodError) {
  const fields = new Set(error.issues.map((issue) => String(issue.path[0] || "form")));
  if (fields.has("password")) return "Use 12+ characters with uppercase, lowercase, a number, and a symbol. Avoid common password phrases.";
  if (fields.has("email")) return "Enter a valid email address.";
  if (fields.has("full_name")) return "Enter your full name.";
  return "Please check the highlighted account details and try again.";
}

function tokenFromGeneratedActionLink(actionLink: string | undefined | null) {
  if (!actionLink) return null;
  try {
    return new URL(actionLink).searchParams.get("token");
  } catch {
    return null;
  }
}

function appAuthConfirmUrl(args: {
  origin: string;
  tokenHash: string;
  type: "signup" | "recovery";
  next: string;
  lead?: string;
}) {
  const params = new URLSearchParams({
    token_hash: args.tokenHash,
    type: args.type,
    next: args.next,
  });
  if (args.lead) params.set("lead", args.lead);
  return `${args.origin}/auth/confirm?${params.toString()}`;
}

export async function oauthAction(formData: FormData) {
  const parsed = oauthSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/auth/login?error=Could%20not%20start%20social%20login");

  const role = parsed.data.role;
  const destination = role ? destinationFor(role, parsed.data.next, parsed.data.talent) : safePath(parsed.data.next, "/");
  const callbackParams = new URLSearchParams({ next: destination });
  if (role) callbackParams.set("role", role);
  if (parsed.data.lead) callbackParams.set("lead", parsed.data.lead);
  // These two auth callbacks were the only places in the app that fell back to
  // localhost when NEXT_PUBLIC_APP_URL was unset -- everything else falls back
  // to the canonical origin. In production that meant Google/Microsoft
  // authenticated the user and then dropped the browser on localhost, which is
  // indistinguishable from "SSO is broken". Use the same origin helper the rest
  // of the app uses, and only refuse when it genuinely resolves to localhost.
  // The buttons are hidden when social login is off, but a stale page or a
  // hand-made POST could still reach this action.
  if (!socialProviderEnabled(parsed.data.provider)) redirect("/auth/login?error=That%20social%20login%20provider%20is%20not%20available%20right%20now.%20Please%20use%20your%20email%20and%20password.");

  const origin = siteOrigin();
  if (process.env.NODE_ENV === "production" && /localhost|127\.0\.0\.1/i.test(origin)) {
    redirect("/auth/login?error=Social%20login%20is%20not%20configured%20on%20this%20deployment%20yet.%20Use%20email%20and%20password%2C%20or%20contact%20support.");
  }
  const callback = `${origin}/auth/callback?${callbackParams.toString()}`;

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

// enforceActionRateLimit throws once the window is exhausted. Uncaught inside a
// server action that is otherwise all redirects, that surfaced as a generic
// error page -- so someone who mistyped their password a few times was told the
// site had crashed rather than to wait a few minutes.
async function limitOrRedirect(actionKey: string, subject: string, maxAttempts: number, maxIpAttempts: number, windowMinutes: number, errorPath: (message: string) => string) {
  try {
    await enforceEmailAndIpRateLimit(actionKey, subject, maxAttempts, maxIpAttempts, windowMinutes);
  } catch (err) {
    if (typeof (err as { digest?: unknown })?.digest === "string" && String((err as { digest: string }).digest).startsWith("NEXT_")) throw err;
    redirect(errorPath((err as Error).message || "Too many attempts. Please wait a few minutes and try again."));
  }
}

export async function loginAction(formData: FormData) {
  const rawEmail = String(formData.get("email") || "").trim().toLowerCase();
  await limitOrRedirect("auth_login", rawEmail, 8, 30, 15, (message) => `/auth/login?error=${encodeURIComponent(message)}`);
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
    const errorCode = String((error as { code?: string }).code || "");
    const needsConfirmation = errorCode === "email_not_confirmed" || /email.*not.*confirm/i.test(error.message);
    const params = new URLSearchParams({
      error: needsConfirmation ? "Confirm your email before logging in." : error.message
    });
    if (needsConfirmation) params.set("confirm", "1");
    if (parsed.data.next) params.set("next", parsed.data.next);
    if (parsed.data.lead) params.set("lead", parsed.data.lead);
    redirect(`/auth/login?${params.toString()}`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getOrBootstrapProfile(user) : null;
  const trainingAccount = user?.user_metadata?.account_type === "training";
  const requestedTraining = isTrainingPath(parsed.data.next) || trainingAccount;
  if (!user || (!profile && !requestedTraining)) {
    await supabase.auth.signOut();
    redirect("/auth/login?error=Your%20account%20was%20authenticated%20but%20its%20workspace%20could%20not%20be%20loaded.%20Please%20try%20again%20or%20contact%20support.");
  }
  try {
    await recordSuccessfulLoginAndMaybeAlert({
      userId: user.id,
      email: user.email,
      fullName: profile?.full_name || (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null),
      signInMethod: "Email & password",
    });
  } catch {
    // Sign-in remains available if security-event persistence is temporarily unavailable.
  }
  const fallback = profile ? `/workspace/${profile.role}` : "/workspace/training";
  const requested = safePath(parsed.data.next, fallback);
  if (!isTrainingPath(requested) && requested.startsWith("/workspace/") && profile?.role && !requested.startsWith(`/workspace/${profile.role}`)) redirect(fallback);
  if (!profile && !isTrainingPath(requested)) redirect("/workspace/training");
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
  await limitOrRedirect("auth_join", rawEmailForLimit, 5, 15, 60, (message) => joinErrorPath(String(formData.get("role")) === "client" ? "client" : "va", message));
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
    console.warn("[auth_join] validation_failed", {
      role,
      fields: [...new Set(parsed.error.issues.map((issue) => String(issue.path[0] || "form")))],
    });
    redirect(joinErrorPath(role, joinValidationMessage(parsed.error), { talent, lead, next }));
  }

  if (isDisposableEmail(parsed.data.email)) {
    redirect(joinErrorPath(role, "Please use a permanent email address. Temporary inbox providers cannot receive account or hiring notifications.", { talent, lead, next }));
  }

  if (await isKnownCompromisedPassword(parsed.data.password)) {
    redirect(joinErrorPath(role, "That password appears in known data breaches. Choose a different password.", { talent, lead, next }));
  }

  // A photo is optional at signup and is collected on the profile instead. If
  // one is supplied anyway, it still has to be a sane image.
  const avatar = formData.get("avatar");
  if (parsed.data.role === "va" && avatar instanceof File && avatar.size > 0) {
    if (avatar.size > 3 * 1024 * 1024) redirect(joinErrorPath("va", "Profile photo must be 3 MB or smaller", { next }));
    if (!["image/jpeg", "image/png", "image/webp"].includes(avatar.type)) redirect(joinErrorPath("va", "Upload a JPG, PNG, or WEBP profile photo", { next }));
  }

  const destination = destinationFor(parsed.data.role, parsed.data.next, parsed.data.talent);
  const origin = siteOrigin();
  if (process.env.NODE_ENV === "production" && /localhost|127\.0\.0\.1/i.test(origin)) {
    redirect(joinErrorPath(parsed.data.role, "Account signup is temporarily unavailable. Please contact support.", { talent: parsed.data.talent, lead: parsed.data.lead, next: parsed.data.next }));
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { role: parsed.data.role, full_name: parsed.data.full_name },
      redirectTo: origin,
    }
  });

  if (error || !data.user) {
    const errorCode = String((error as { code?: string } | null)?.code || "");
    const accountMayExist = errorCode === "email_exists" || /already|registered|exists/i.test(error?.message || "");
    const logContext = { role: parsed.data.role, code: errorCode || null, status: (error as { status?: number } | null)?.status || null };
    if (accountMayExist) console.info("[auth_join] account_exists", logContext);
    else console.error("[auth_join] generate_link_failed", logContext);
    if (accountMayExist) {
      const loginParams = new URLSearchParams({
        message: "An account may already exist for this email. Log in to continue.",
        next: destination
      });
      if (parsed.data.lead) loginParams.set("lead", parsed.data.lead);
      redirect(`/auth/login?${loginParams.toString()}`);
    }
    redirect(joinErrorPath(parsed.data.role, error?.message || "We could not create your account. Please try again.", { talent: parsed.data.talent, lead: parsed.data.lead, next: parsed.data.next }));
  }

  const tokenHash = tokenFromGeneratedActionLink(data.properties?.action_link);
  if (!tokenHash) {
    await admin.auth.admin.deleteUser(data.user.id);
    redirect(joinErrorPath(parsed.data.role, "We could not create a secure confirmation link. Please try again.", { talent: parsed.data.talent, lead: parsed.data.lead, next: parsed.data.next }));
  }

  const confirmationUrl = appAuthConfirmUrl({
    origin,
    tokenHash,
    type: "signup",
    next: destination,
    lead: parsed.data.role === "client" ? parsed.data.lead : undefined,
  });

  const workspaceProfile = await getOrBootstrapProfile(data.user);
  if (!workspaceProfile || workspaceProfile.role !== parsed.data.role) {
    await admin.auth.admin.deleteUser(data.user.id);
    redirect(joinErrorPath(parsed.data.role, "We could not finish setting up your workspace. Please try again.", { talent: parsed.data.talent, lead: parsed.data.lead, next: parsed.data.next }));
  }

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
    await recordProductEvent("account_created", {
      userId: data.user.id,
      path: `/auth/join/${parsed.data.role}`,
      metadata: { role: parsed.data.role, requested_talent: Boolean(parsed.data.talent), claimed_lead: Boolean(parsed.data.lead) }
    });
  } catch {
    // Analytics failures must not block a valid signup.
  }

  let brandedConfirmationSent = false;
  try {
    const result = await sendAccountConfirmationEmail({
      to: parsed.data.email,
      actionUrl: confirmationUrl,
      idempotencyKey: `account-confirmation-${data.user.id}`,
    });
    brandedConfirmationSent = result.sent;
    if (!result.sent) {
      console.error("[auth_join] confirmation_send_failed", {
        role: parsed.data.role,
        reason: result.reason || "provider_error",
      });
    }
  } catch (error) {
    brandedConfirmationSent = false;
    console.error("[auth_join] confirmation_send_failed", {
      role: parsed.data.role,
      reason: error instanceof Error ? error.message : "provider_error",
    });
  }

  // Do not fall back to Supabase Auth's email sender here. We already generated
  // the secure Supabase token above and send it through our transactional email
  // provider. Calling auth.resend() adds Supabase's separate auth-email rate
  // limit and, with the same SMTP provider behind it, is not an independent
  // delivery path. The login page exposes the branded resend action instead.
  const loginParams = new URLSearchParams({
    message: "Check your email to confirm your account",
    next: destination,
    confirm: "1"
  });
  if (!brandedConfirmationSent) {
    loginParams.set("message", "Your account was created, but the confirmation email could not be sent. Use Resend confirmation below.");
  }
  if (parsed.data.lead) loginParams.set("lead", parsed.data.lead);
  redirect(`/auth/login?${loginParams.toString()}`);
}

export async function chooseOAuthRoleAction(formData: FormData) {
  const role = String(formData.get("role") || "") === "client" ? "client" : "va";
  const next = String(formData.get("next") || "").trim() || undefined;
  const leadRaw = String(formData.get("lead") || "").trim();
  const lead = z.string().uuid().safeParse(leadRaw).success ? leadRaw : undefined;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?error=Please%20sign%20in%20with%20Google%20again.");

  const existingProfile = await getOrBootstrapProfile(user);
  if (existingProfile) {
    const fallback = `/workspace/${existingProfile.role}`;
    const requested = safePath(next, fallback);
    redirect(requested.startsWith("/workspace/") && !requested.startsWith(fallback) ? fallback : requested);
  }

  const { data, error } = await supabase.auth.updateUser({
    data: { ...user.user_metadata, role }
  });
  if (error || !data.user) redirect("/auth/choose-role?error=We%20could%20not%20finish%20setting%20up%20your%20workspace.");

  const profile = await getOrBootstrapProfile(data.user);
  if (!profile) redirect("/auth/choose-role?error=We%20could%20not%20create%20your%20workspace.%20Please%20try%20again.");

  let claimedJobId: string | null = null;
  if (profile.role === "client" && lead && data.user.email) {
    try {
      claimedJobId = await claimClientHiringRequests({ userId: data.user.id, email: data.user.email, leadId: lead });
    } catch {
      // Role setup must still succeed if a stale hiring request cannot be claimed.
    }
  }
  if (claimedJobId) redirect(`/workspace/client/jobs/${claimedJobId}?claimed=1`);

  const fallback = `/workspace/${profile.role}`;
  const requested = safePath(next, fallback);
  redirect(requested.startsWith("/workspace/") && !requested.startsWith(fallback) ? fallback : requested);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  await limitOrRedirect("password_reset", email, 4, 12, 60, (message) => `/auth/login?error=${encodeURIComponent(message)}`);

  if (email) {
    let brandedRecoverySent = false;
    try {
      const admin = createAdminClient();
      const { data, error } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: siteOrigin() }
      });
      if (!error) {
        const tokenHash = tokenFromGeneratedActionLink(data.properties?.action_link);
        if (tokenHash && data.user?.id) {
          const recoveryUrl = appAuthConfirmUrl({
            origin: siteOrigin(),
            tokenHash,
            type: "recovery",
            next: "/auth/update-password",
          });
          const recoverySubject = data.user.id;
          const recoveryWindow = Math.floor(Date.now() / (5 * 60 * 1000));
          const result = await sendPasswordRecoveryEmail({
            to: email,
            actionUrl: recoveryUrl,
            idempotencyKey: `password-recovery-${recoverySubject}-${recoveryWindow}`,
          });
          brandedRecoverySent = result.sent;
        }
      }
    } catch {
      brandedRecoverySent = false;
    }

    if (!brandedRecoverySent) {
      try {
        const fallbackSupabase = await createClient();
        await fallbackSupabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteOrigin()}/auth/callback?next=/auth/update-password` });
      } catch {
        // Keep the response non-enumerating even if both providers reject the request.
      }
    }
  }

  redirect("/auth/login?message=If%20that%20email%20exists,%20a%20reset%20link%20has%20been%20sent");
}

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!newPasswordSchema.safeParse(password).success) {
    redirect("/auth/update-password?error=Use%2012%2B%20characters%20with%20uppercase%2C%20lowercase%2C%20a%20number%2C%20and%20a%20symbol.%20Avoid%20common%20password%20phrases.");
  }
  if (await isKnownCompromisedPassword(password)) {
    redirect("/auth/update-password?error=That%20password%20appears%20in%20known%20data%20breaches.%20Choose%20a%20different%20password.");
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/auth/update-password?error=${encodeURIComponent(error.message)}`);
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getOrBootstrapProfile(user) : null;
  if (user?.email) { try { const { sendTransactionalEventEmail } = await import("@/lib/email"); await sendTransactionalEventEmail({ to: user.email, subject: "Your password was changed", heading: "Password updated", body: "The password for your VirtualAssistant.com.ph account was changed. If you did not do this, contact support immediately.", archive: false }); } catch {} }
  if (profile?.role) redirect(`/workspace/${profile.role}`);
  if (user) redirect("/workspace/training");
  redirect("/auth/login?error=Your%20account%20could%20not%20be%20loaded");
}
