"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { MIN_HOURLY_RATE, VA_CATEGORIES } from "@/lib/constants";

function numberValue(value: FormDataEntryValue | null) {
  const parsed = Number(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function onboardingError(message: string) {
  redirect(`/workspace/va/onboarding?error=${encodeURIComponent(message)}`);
}

export async function completeVaQuickSetupAction(formData: FormData) {
  const { user } = await requireRole("va");
  const category = String(formData.get("primary_category") || "").trim();
  const headline = String(formData.get("headline") || "").trim();
  const yearsExperience = numberValue(formData.get("years_experience"));
  const weeklyHours = numberValue(formData.get("weekly_hours"));
  const hourlyRate = numberValue(formData.get("hourly_rate"));

  if (!VA_CATEGORIES.includes(category as (typeof VA_CATEGORIES)[number])) onboardingError("Choose the VA specialty that best matches your work.");
  if (headline.length < 8 || headline.length > 80) onboardingError("Write a short professional headline between 8 and 80 characters.");
  if (yearsExperience == null || !Number.isInteger(yearsExperience) || yearsExperience < 0 || yearsExperience > 60) onboardingError("Enter your years of professional experience.");
  if (weeklyHours == null || !Number.isInteger(weeklyHours) || weeklyHours < 1 || weeklyHours > 80) onboardingError("Enter how many hours you can work each week.");
  if (hourlyRate == null || hourlyRate < MIN_HOURLY_RATE || hourlyRate > 1000) onboardingError(`Preferred rate must be at least USD ${MIN_HOURLY_RATE} per hour.`);

  const admin = createAdminClient();
  const { data: updatedProfile, error: profileError } = await admin.from("va_profiles").update({
    primary_category: category,
    headline,
    years_experience: yearsExperience,
    weekly_hours: weeklyHours,
    hourly_rate: hourlyRate
  }).eq("user_id", user.id).select("user_id").maybeSingle();
  if (profileError || !updatedProfile) onboardingError("We could not save your quick setup. Please try again.");

  const { error: vettingError } = await admin.from("va_vetting").upsert(
    { va_id: user.id },
    { onConflict: "va_id", ignoreDuplicates: true }
  );
  if (vettingError) onboardingError("Your profile was saved, but we could not initialize vetting. Please try again.");

  revalidatePath("/workspace/va");
  revalidatePath("/workspace/va/onboarding");
  revalidatePath("/workspace/va/profile");
  revalidatePath("/workspace/va/vetting");
  revalidatePath("/workspace/recruiter/categories");
  revalidatePath("/workspace/recruiter/talent");
  redirect("/workspace/va/profile?saved=1#basics");
}