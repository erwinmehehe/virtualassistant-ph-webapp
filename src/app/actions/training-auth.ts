"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { enforceEmailAndIpRateLimit } from "@/lib/rate-limit";
import { isDisposableEmail } from "@/lib/disposable-email";
import { isKnownCompromisedPassword } from "@/lib/pwned-password";
import { verifyTurnstile } from "@/lib/turnstile";
import { siteOrigin } from "@/lib/seo-url";
import { sendAccountConfirmationEmail } from "@/lib/email";
import { recordProductEvent } from "@/lib/product-events";

const COMMON_PASSWORD_PARTS = ["password", "qwerty", "letmein", "welcome", "admin", "iloveyou", "123456"];

const trainingJoinSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string()
    .min(12)
    .max(128)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/)
    .refine((value) => !COMMON_PASSWORD_PARTS.some((part) => value.toLowerCase().includes(part))),
});

function joinError(message: string): never {
  redirect(`/auth/join/training?error=${encodeURIComponent(message)}`);
}

function tokenFromGeneratedActionLink(actionLink: string | undefined | null) {
  if (!actionLink) return null;
  try {
    return new URL(actionLink).searchParams.get("token");
  } catch {
    return null;
  }
}

export async function joinTrainingAction(formData: FormData) {
  const rawEmail = String(formData.get("email") || "").trim().toLowerCase();

  try {
    await enforceEmailAndIpRateLimit("training_join", rawEmail, 5, 15, 60);
  } catch (error) {
    joinError((error as Error).message || "Too many attempts. Please wait before trying again.");
  }

  if (!(await verifyTurnstile(formData))) {
    joinError("Please complete the security check.");
  }

  const parsed = trainingJoinSchema.safeParse({
    full_name: formData.get("full_name"),
    email: rawEmail,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fields = new Set(parsed.error.issues.map((issue) => String(issue.path[0] || "form")));
    if (fields.has("password")) {
      joinError("Use 12+ characters with uppercase, lowercase, a number, and a symbol. Avoid common password phrases.");
    }
    if (fields.has("email")) joinError("Enter a valid email address.");
    joinError("Enter your full name.");
  }

  if (isDisposableEmail(parsed.data.email)) {
    joinError("Please use a permanent email address so you can recover your progress and certificates.");
  }

  if (await isKnownCompromisedPassword(parsed.data.password)) {
    joinError("That password appears in known data breaches. Choose a different password.");
  }

  const origin = siteOrigin();
  if (process.env.NODE_ENV === "production" && /localhost|127\.0\.0\.1/i.test(origin)) {
    joinError("Training signup is temporarily unavailable. Please try again later.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        account_type: "training",
      },
      redirectTo: origin,
    },
  });

  if (error || !data.user) {
    const errorCode = String((error as { code?: string } | null)?.code || "");
    const accountMayExist = errorCode === "email_exists" || /already|registered|exists/i.test(error?.message || "");

    if (accountMayExist) {
      const params = new URLSearchParams({
        message: "An account may already exist for this email. Log in to continue your free training.",
        next: "/workspace/training",
      });
      redirect(`/auth/login?${params.toString()}`);
    }

    joinError(error?.message || "We could not create your training account. Please try again.");
  }

  const tokenHash = tokenFromGeneratedActionLink(data.properties?.action_link);
  if (!tokenHash) {
    await admin.auth.admin.deleteUser(data.user.id);
    joinError("We could not create a secure confirmation link. Please try again.");
  }

  await recordProductEvent("training_account_created", {
    userId: data.user.id,
    path: "/auth/join/training",
    metadata: { account_type: "training" },
  });

  const confirmationParams = new URLSearchParams({
    token_hash: tokenHash,
    type: "signup",
    next: "/workspace/training",
  });
  const confirmationUrl = `${origin}/auth/confirm?${confirmationParams.toString()}`;

  let brandedConfirmationSent = false;
  try {
    const result = await sendAccountConfirmationEmail({
      to: parsed.data.email,
      actionUrl: confirmationUrl,
    });
    brandedConfirmationSent = result.sent;
  } catch {
    brandedConfirmationSent = false;
  }

  let fallbackConfirmationSent = false;
  if (!brandedConfirmationSent) {
    try {
      const supabase = await createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: parsed.data.email,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/workspace/training")}`,
        },
      });
      fallbackConfirmationSent = !resendError;
    } catch {
      fallbackConfirmationSent = false;
    }
  }

  const params = new URLSearchParams({
    next: "/workspace/training",
    confirm: "1",
    message: brandedConfirmationSent || fallbackConfirmationSent
      ? "Check your email to confirm your free training account."
      : "Your training account was created, but the confirmation email could not be sent. Use Resend email below.",
  });
  redirect(`/auth/login?${params.toString()}`);
}
