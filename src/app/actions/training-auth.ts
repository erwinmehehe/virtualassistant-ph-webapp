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
import {
  safeTrainingCourseSlug,
  trainingCourseDestination,
} from "@/lib/training-intent";

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

export type TrainingJoinState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors: {
    full_name?: string;
    email?: string;
    password?: string;
  };
  attempt: number;
  email?: string;
  next?: string;
  courseTitle?: string | null;
  emailSent?: boolean;
};

export const initialTrainingJoinState: TrainingJoinState = {
  status: "idle",
  message: "",
  fieldErrors: {},
  attempt: 0,
};

function tokenFromGeneratedActionLink(actionLink: string | undefined | null) {
  if (!actionLink) return null;
  try {
    return new URL(actionLink).searchParams.get("token");
  } catch {
    return null;
  }
}

async function joinError(
  previousState: TrainingJoinState,
  message: string,
  reason: string,
  fieldErrors: TrainingJoinState["fieldErrors"] = {},
): Promise<TrainingJoinState> {
  await recordProductEvent("training_signup_error", {
    path: "/auth/join/training",
    metadata: { reason },
  });
  return {
    status: "error",
    message,
    fieldErrors,
    attempt: previousState.attempt + 1,
  };
}

export async function joinTrainingAction(
  previousState: TrainingJoinState,
  formData: FormData,
): Promise<TrainingJoinState> {
  const rawEmail = String(formData.get("email") || "").trim().toLowerCase();
  const requestedCourseSlug = safeTrainingCourseSlug(String(formData.get("course_slug") || ""));

  try {
    await enforceEmailAndIpRateLimit("training_join", rawEmail, 5, 15, 60);
  } catch (error) {
    return joinError(
      previousState,
      (error as Error).message || "Too many attempts. Please wait before trying again.",
      "rate_limit",
    );
  }

  if (!(await verifyTurnstile(formData))) {
    return joinError(
      previousState,
      "Please complete the security check and try again.",
      "turnstile",
    );
  }

  const parsed = trainingJoinSchema.safeParse({
    full_name: formData.get("full_name"),
    email: rawEmail,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fields = new Set(parsed.error.issues.map((issue) => String(issue.path[0] || "form")));
    const fieldErrors: TrainingJoinState["fieldErrors"] = {};
    if (fields.has("full_name")) fieldErrors.full_name = "Enter your full name.";
    if (fields.has("email")) fieldErrors.email = "Enter a valid email address.";
    if (fields.has("password")) {
      fieldErrors.password = "Use 12+ characters with uppercase, lowercase, a number, and a symbol. Avoid common password phrases.";
    }
    return joinError(
      previousState,
      fieldErrors.password || fieldErrors.email || fieldErrors.full_name || "Check the highlighted fields.",
      "validation",
      fieldErrors,
    );
  }

  if (isDisposableEmail(parsed.data.email)) {
    return joinError(
      previousState,
      "Please use a permanent email address so you can recover your progress and certificates.",
      "disposable_email",
      { email: "Use a permanent email address." },
    );
  }

  if (await isKnownCompromisedPassword(parsed.data.password)) {
    return joinError(
      previousState,
      "That password appears in known data breaches. Choose a different password.",
      "compromised_password",
      { password: "Choose a different password." },
    );
  }

  const origin = siteOrigin();
  if (process.env.NODE_ENV === "production" && /localhost|127\.0\.0\.1/i.test(origin)) {
    return joinError(
      previousState,
      "Training signup is temporarily unavailable. Please try again later.",
      "origin_configuration",
    );
  }

  const admin = createAdminClient();
  let courseSlug: string | null = null;
  let courseTitle: string | null = null;

  if (requestedCourseSlug) {
    const { data: requestedCourse } = await admin
      .from("training_courses")
      .select("slug,title")
      .eq("slug", requestedCourseSlug)
      .eq("status", "published")
      .maybeSingle();
    if (requestedCourse) {
      courseSlug = requestedCourse.slug;
      courseTitle = requestedCourse.title;
    }
  }

  const next = trainingCourseDestination(courseSlug);

  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        account_type: "training",
        ...(courseSlug ? { intended_training_course: courseSlug } : {}),
      },
      redirectTo: origin,
    },
  });

  if (error || !data.user) {
    const errorCode = String((error as { code?: string } | null)?.code || "");
    const accountMayExist = errorCode === "email_exists" || /already|registered|exists/i.test(error?.message || "");

    if (accountMayExist) {
      const params = new URLSearchParams({
        message: courseTitle
          ? `An account may already exist for this email. Log in to continue to ${courseTitle}.`
          : "An account may already exist for this email. Log in to continue your free training.",
        next,
      });
      redirect(`/auth/login?${params.toString()}`);
    }

    return joinError(
      previousState,
      error?.message || "We could not create your training account. Please try again.",
      "account_creation",
    );
  }

  const tokenHash = tokenFromGeneratedActionLink(data.properties?.action_link);
  if (!tokenHash) {
    await admin.auth.admin.deleteUser(data.user.id);
    return joinError(
      previousState,
      "We could not create a secure confirmation link. Please try again.",
      "confirmation_link",
    );
  }

  await recordProductEvent("training_account_created", {
    userId: data.user.id,
    path: "/auth/join/training",
    metadata: {
      account_type: "training",
      course_slug: courseSlug,
    },
  });

  const confirmationParams = new URLSearchParams({
    token_hash: tokenHash,
    type: "signup",
    next,
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
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      fallbackConfirmationSent = !resendError;
    } catch {
      fallbackConfirmationSent = false;
    }
  }

  const emailSent = brandedConfirmationSent || fallbackConfirmationSent;
  await recordProductEvent("training_confirmation_sent", {
    userId: data.user.id,
    path: "/auth/join/training",
    metadata: {
      course_slug: courseSlug,
      delivery: brandedConfirmationSent ? "branded" : fallbackConfirmationSent ? "supabase" : "failed",
    },
  });

  return {
    status: "success",
    message: emailSent
      ? "Check your email to confirm your free training account."
      : "Your training account was created, but the confirmation email could not be sent. Use the resend option below.",
    fieldErrors: {},
    attempt: previousState.attempt + 1,
    email: parsed.data.email,
    next,
    courseTitle,
    emailSent,
  };
}
