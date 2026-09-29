"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { VA_CATEGORIES } from "@/lib/constants";
import { getBusinessSettings } from "@/lib/business-settings";
import { recordProductEvent } from "@/lib/product-events";

function numberValue(value: FormDataEntryValue | null) {
  const parsed = Number(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : null;
}

async function onboardingError(userId: string, step: number, field: string, message: string): Promise<never> {
  await recordProductEvent("va_onboarding_validation_error", {
    userId,
    path: "/workspace/va/onboarding",
    metadata: { step, field },
  });
  redirect(`/workspace/va/onboarding?step=${step}&error=${encodeURIComponent(message)}`);
}

function revalidateVaOnboarding() {
  revalidatePath("/workspace/va");
  revalidatePath("/workspace/va/onboarding");
  revalidatePath("/workspace/va/profile");
  revalidatePath("/workspace/va/vetting");
  revalidatePath("/workspace/recruiter/categories");
  revalidatePath("/workspace/recruiter/talent");
}

export async function saveVaOnboardingBasicsAction(formData: FormData) {
  const { user } = await requireRole("va");
  const category = String(formData.get("primary_category") || "").trim();
  const headline = String(formData.get("headline") || "").trim();

  if (!VA_CATEGORIES.includes(category as (typeof VA_CATEGORIES)[number])) {
    return onboardingError(user.id, 1, "primary_category", "Choose the VA specialty that best matches your work.");
  }
  if (headline.length < 8 || headline.length > 80) {
    return onboardingError(user.id, 1, "headline", "Write a short professional headline between 8 and 80 characters.");
  }

  const admin = createAdminClient();
  const { data: updatedProfile, error: profileError } = await admin
    .from("va_profiles")
    .update({
      primary_category: category,
      headline,
    })
    .eq("user_id", user.id)
    .select("user_id")
    .maybeSingle();

  if (profileError || !updatedProfile) {
    return onboardingError(user.id, 1, "save", "We could not save this step. Please try again.");
  }

  await recordProductEvent("va_onboarding_step_saved", {
    userId: user.id,
    path: "/workspace/va/onboarding",
    metadata: { step: 1, section: "specialty" },
  });

  revalidateVaOnboarding();
  redirect("/workspace/va/onboarding?step=2&saved=1");
}

export async function saveVaOnboardingWorkAction(formData: FormData) {
  const [{ user }, settings] = await Promise.all([requireRole("va"), getBusinessSettings()]);
  const yearsExperience = numberValue(formData.get("years_experience"));
  const weeklyHours = numberValue(formData.get("weekly_hours"));
  const hourlyRate = numberValue(formData.get("hourly_rate"));

  if (yearsExperience == null || !Number.isInteger(yearsExperience) || yearsExperience < 0 || yearsExperience > 60) {
    return onboardingError(user.id, 2, "years_experience", "Enter your years of professional experience.");
  }
  if (weeklyHours == null || !Number.isInteger(weeklyHours) || weeklyHours < 1 || weeklyHours > 80) {
    return onboardingError(user.id, 2, "weekly_hours", "Enter how many hours you can work each week.");
  }
  if (hourlyRate == null || hourlyRate < settings.minHourlyRate || hourlyRate > 1000) {
    return onboardingError(user.id, 2, "hourly_rate", `Preferred rate must be at least USD ${settings.minHourlyRate} per hour.`);
  }

  const admin = createAdminClient();
  const { data: updatedProfile, error: profileError } = await admin
    .from("va_profiles")
    .update({
      years_experience: yearsExperience,
      weekly_hours: weeklyHours,
      hourly_rate: hourlyRate,
    })
    .eq("user_id", user.id)
    .select("user_id")
    .maybeSingle();

  if (profileError || !updatedProfile) {
    return onboardingError(user.id, 2, "save", "We could not save this step. Please try again.");
  }

  await recordProductEvent("va_onboarding_step_saved", {
    userId: user.id,
    path: "/workspace/va/onboarding",
    metadata: { step: 2, section: "work_preferences" },
  });

  revalidateVaOnboarding();
  redirect("/workspace/va/onboarding?step=3&saved=1");
}

export async function completeVaQuickSetupAction(formData: FormData) {
  const { user } = await requireRole("va");
  const address = String(formData.get("address") || "").replace(/\s+/g, " ").trim();

  if (address.length < 5 || address.length > 200) {
    return onboardingError(user.id, 3, "address", "Enter your current home address.");
  }

  const admin = createAdminClient();
  const { data: updatedProfile, error: profileError } = await admin
    .from("va_profiles")
    .update({ address })
    .eq("user_id", user.id)
    .select("user_id,primary_category,headline,years_experience,weekly_hours,hourly_rate,address")
    .maybeSingle();

  if (profileError || !updatedProfile) {
    return onboardingError(user.id, 3, "save", "We could not save your address. Please try again.");
  }

  if (!updatedProfile.primary_category || String(updatedProfile.headline || "").trim().length < 8) {
    return onboardingError(user.id, 1, "incomplete_step", "Finish your specialty and headline first.");
  }
  if (
    updatedProfile.years_experience == null ||
    updatedProfile.weekly_hours == null ||
    updatedProfile.hourly_rate == null
  ) {
    return onboardingError(user.id, 2, "incomplete_step", "Finish your experience, availability, and rate first.");
  }

  const { error: vettingError } = await admin.from("va_vetting").upsert(
    { va_id: user.id },
    { onConflict: "va_id", ignoreDuplicates: true }
  );
  if (vettingError) {
    return onboardingError(user.id, 3, "vetting", "Your profile was saved, but we could not initialize vetting. Please try again.");
  }

  await recordProductEvent("va_onboarding_step_saved", {
    userId: user.id,
    path: "/workspace/va/onboarding",
    metadata: { step: 3, section: "private_address" },
  });
  await recordProductEvent("va_onboarding_complete", {
    userId: user.id,
    path: "/workspace/va/onboarding",
    metadata: { steps: 3 },
  });

  revalidateVaOnboarding();
  redirect("/workspace/va?setup=complete");
}
