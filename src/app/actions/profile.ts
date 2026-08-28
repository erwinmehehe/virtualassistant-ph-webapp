"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MIN_HOURLY_RATE, VETTING_PROFILE_MIN } from "@/lib/constants";
import { getVaCompletion } from "@/lib/profile-completeness";
import { PUBLIC_VA_MIN_EXPERIENCE } from "@/lib/public-routing";

// Each tag is meant to be a short label ("Customer Service", "HubSpot"),
// not a pasted paragraph. A missing comma between entries (usually from
// pasting a whole skills paragraph into one box) used to silently become
// one giant tag that broke card layouts wherever it was shown as a pill.
// Rejecting it with a clear message -- instead of silently truncating --
// means the person actually fixes their input rather than saving a
// confusing, cut-off half-sentence.
const MAX_TAG_LENGTH = 60;
function list(value: FormDataEntryValue | null, fieldLabel: string) {
  const items = String(value ?? "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 30);
  const oversized = items.find((x) => x.length > MAX_TAG_LENGTH);
  if (oversized) {
    throw new Error(`One of your ${fieldLabel} entries is too long ("${oversized.slice(0, 40)}..."). Separate entries with commas -- each one should be a short label, not a full sentence.`);
  }
  return items;
}
// A headline is a one-line tagline shown next to the person's name on cards
// and search results ("Senior Ecommerce VA | Shopify & Klaviyo") -- not a
// place to stack every job title and specialty keyword for SEO. Cap the
// length and the number of "|"/"," separators so that stuffing gets
// rejected with a clear message instead of silently rendering as a wall of
// text that crowds out everyone else's card.
const MAX_HEADLINE_LENGTH = 80;
const MAX_HEADLINE_SEPARATORS = 2;
function headline(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (raw.length > MAX_HEADLINE_LENGTH) {
    throw new Error(`Your headline is too long (${raw.length} characters, max ${MAX_HEADLINE_LENGTH}). Keep it to one short line, e.g. "Senior Ecommerce VA | Shopify & Klaviyo" -- not a list of every title and specialty.`);
  }
  const separators = (raw.match(/[|,]/g) || []).length;
  if (separators > MAX_HEADLINE_SEPARATORS) {
    throw new Error(`Your headline has too many "${"|"}"/"," separators for one line. Pick your single strongest title -- add the rest as categories or skills instead.`);
  }
  return raw;
}
const numberOrNull = (value: FormDataEntryValue | null) => value ? Number(value) : null;
const cleanUrl = (value: FormDataEntryValue | null) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("Use a valid URL including https://"); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Only http or https URLs are allowed.");
  return url.toString();
};

export async function updateVaProfileAction(formData: FormData) {
  const { user } = await requireRole("va");
  const supabase = await createClient();
  const admin = createAdminClient();

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (fullName.length < 2 || fullName.length > 100) throw new Error("Enter your full name.");
  const hourlyRate = numberOrNull(formData.get("hourly_rate"));
  const yearsExperience = numberOrNull(formData.get("years_experience"));
  const weeklyHours = numberOrNull(formData.get("weekly_hours"));
  const overlapHours = numberOrNull(formData.get("overlap_hours"));
  if (hourlyRate != null && (!Number.isFinite(hourlyRate) || hourlyRate < MIN_HOURLY_RATE || hourlyRate > 1000)) throw new Error(`Hourly rate must be at least USD ${MIN_HOURLY_RATE}.`);
  if (yearsExperience != null && (!Number.isInteger(yearsExperience) || yearsExperience < 0 || yearsExperience > 60)) throw new Error("Years of experience must be between 0 and 60.");
  if (weeklyHours != null && (!Number.isInteger(weeklyHours) || weeklyHours < 1 || weeklyHours > 80)) throw new Error("Weekly availability must be between 1 and 80 hours.");
  if (overlapHours != null && (!Number.isInteger(overlapHours) || overlapHours < 0 || overlapHours > 12)) throw new Error("Daily overlap must be between 0 and 12 hours.");

  const updates = {
    headline: headline(formData.get("headline")),
    bio: String(formData.get("bio") ?? "").trim() || null,
    primary_category: String(formData.get("primary_category") ?? "").trim() || null,
    categories: list(formData.get("categories"), "additional specialty").slice(0, 3),
    skills: list(formData.get("skills"), "skill"),
    tools: list(formData.get("tools"), "tool"),
    industries: list(formData.get("industries"), "industry"),
    languages: list(formData.get("languages"), "language"),
    years_experience: yearsExperience,
    weekly_hours: weeklyHours,
    schedule: String(formData.get("schedule") ?? "").trim() || null,
    overlap_hours: overlapHours,
    hourly_rate: hourlyRate,
    portfolio_url: cleanUrl(formData.get("portfolio_url")),
    linkedin_url: cleanUrl(formData.get("linkedin_url")),
    availability_status: String(formData.get("availability_status") ?? "available"),
    directory_visible: formData.get("directory_visible") === "on"
  };

  const [{ data: current }, { data: vetting }, { data: currentProfile }] = await Promise.all([
    admin.from("va_profiles").select("*").eq("user_id", user.id).single(),
    admin.from("va_vetting").select("stage").eq("va_id", user.id).maybeSingle(),
    admin.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle()
  ]);
  const listKey = (value: unknown) => Array.isArray(value) ? [...value].map(String).sort().join("\u0000") : "";
  const categoryChanged = (current?.primary_category ?? null) !== updates.primary_category;
  let materialChanged = categoryChanged ||
    (current?.headline ?? null) !== updates.headline ||
    (current?.bio ?? null) !== updates.bio ||
    listKey(current?.categories) !== listKey(updates.categories) ||
    listKey(current?.skills) !== listKey(updates.skills) ||
    listKey(current?.tools) !== listKey(updates.tools) ||
    listKey(current?.industries) !== listKey(updates.industries) ||
    listKey(current?.languages) !== listKey(updates.languages) ||
    (current?.years_experience ?? null) !== updates.years_experience ||
    (current?.portfolio_url ?? null) !== updates.portfolio_url ||
    (current?.linkedin_url ?? null) !== updates.linkedin_url;

  if (!current) throw new Error("VA profile not found.");
  const [{ error: nameError }, { error: profileError }] = await Promise.all([
    admin.from("profiles").update({ full_name: fullName }).eq("id", user.id),
    admin.from("va_profiles").update(updates).eq("user_id", user.id)
  ]);
  if (nameError) throw nameError;
  if (profileError) throw profileError;

  const resume = formData.get("resume");
  if (resume instanceof File && resume.size > 0) {
    if (resume.size > 5 * 1024 * 1024) throw new Error("Resume must be 5 MB or smaller.");
    const extension = resume.name.toLowerCase().match(/\.(pdf|doc|docx)$/)?.[1];
    const allowedMime = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream", ""]);
    if (!extension || !allowedMime.has(resume.type)) throw new Error("Upload a PDF, DOC, or DOCX resume only.");
    const safeName = resume.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${user.id}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("resumes").upload(path, resume, { upsert: false, contentType: resume.type || undefined });
    if (error) throw error;
    const { error: resumePathError } = await admin.from("va_profiles").update({ resume_path: path }).eq("user_id", user.id);
    if (resumePathError) {
      await supabase.storage.from("resumes").remove([path]);
      throw resumePathError;
    }
    if (current.resume_path && current.resume_path !== path) await supabase.storage.from("resumes").remove([current.resume_path]);
    materialChanged = true;
  }

  const avatar = formData.get("avatar");
  let hasProfilePhoto = Boolean(currentProfile?.avatar_url);
  if (avatar instanceof File && avatar.size > 0) {
    if (avatar.size > 3 * 1024 * 1024) throw new Error("Photo must be 3 MB or smaller.");
    const allowedMime = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowedMime.has(avatar.type)) throw new Error("Upload a JPG, PNG, or WEBP photo only.");
    const extension = avatar.type === "image/png" ? "png" : avatar.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatar, { upsert: false, contentType: avatar.type });
    if (uploadError) throw uploadError;
    const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: avatarPathError } = await admin.from("profiles").update({ avatar_url: publicUrl.publicUrl }).eq("id", user.id);
    if (avatarPathError) {
      await supabase.storage.from("avatars").remove([path]);
      throw avatarPathError;
    }
    // Best-effort cleanup of the previous photo, matched by the storage path
    // segment after "/avatars/" in its public URL.
    const previousPath = currentProfile?.avatar_url?.split("/avatars/")[1];
    if (previousPath && previousPath !== path) await supabase.storage.from("avatars").remove([previousPath]);
    hasProfilePhoto = true;
    materialChanged = true;
  }

  if (materialChanged && vetting && ["approved", "bench"].includes(vetting.stage)) {
    await admin.from("va_profiles").update({ directory_visible: false }).eq("user_id", user.id);
    if (categoryChanged) {
      // A new primary category requires a category-appropriate test and a fresh recruiter scorecard.
      await admin.from("vetting_scorecards").delete().eq("va_id", user.id);
      await admin.from("va_vetting").update({ stage: "test", recruiter_id: null, approved_at: null }).eq("va_id", user.id);
    } else {
      // Keep prior recruiter evidence, but require Admin to approve the changed public evidence again.
      await admin.from("va_vetting").update({ stage: "finalist", approved_at: null }).eq("va_id", user.id);
    }
  }

  const { data: refreshed } = await admin.from("va_profiles").select("*").eq("user_id", user.id).single();
  if (refreshed && refreshed.directory_visible) {
    const completion = getVaCompletion(refreshed);
    if (!hasProfilePhoto || completion.score < VETTING_PROFILE_MIN || refreshed.availability_status !== "available" || Number(refreshed.years_experience || 0) < PUBLIC_VA_MIN_EXPERIENCE) {
      await admin.from("va_profiles").update({ directory_visible: false }).eq("user_id", user.id);
    }
  }

  revalidatePath("/workspace/va");
  revalidatePath("/workspace/va/profile");
  revalidatePath("/workspace/va/vetting");
  revalidatePath("/workspace/admin/vetting");
  revalidatePath("/find-talent");
}

export async function updateClientProfileAction(formData: FormData) {
  const { user } = await requireRole("client");
  const admin = createAdminClient();
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (fullName && (fullName.length < 2 || fullName.length > 100)) throw new Error("Enter a valid name.");
  const { error: nameError } = await admin.from("profiles").update({ full_name: fullName || null }).eq("id", user.id);
  if (nameError) throw nameError;
  const { error: companyError } = await admin.from("client_profiles").update({
    company_name: String(formData.get("company_name") ?? "").trim() || null,
    website: cleanUrl(formData.get("website")),
    industry: String(formData.get("industry") ?? "").trim() || null,
    timezone: String(formData.get("timezone") ?? "").trim() || null,
    team_size: String(formData.get("team_size") ?? "").trim() || null,
    company_description: String(formData.get("company_description") ?? "").trim() || null,
    logo_url: cleanUrl(formData.get("logo_url")),
    location: String(formData.get("location") ?? "").trim() || null,
    hiring_needs: String(formData.get("hiring_needs") ?? "").trim() || null,
    hiring_notes: String(formData.get("hiring_notes") ?? "").trim() || null
  }).eq("user_id", user.id);
  if (companyError) throw companyError;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    if (logo.size > 3 * 1024 * 1024) throw new Error("Company logo must be 3 MB or smaller.");
    if (!["image/jpeg","image/png","image/webp"].includes(logo.type)) throw new Error("Upload a JPG, PNG, or WEBP company logo.");
    const ext = logo.type === "image/png" ? "png" : logo.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/logo-${Date.now()}.${ext}`;
    const { error: uploadError } = await admin.storage.from("company-logos").upload(path, logo, { upsert: false, contentType: logo.type });
    if (uploadError) throw uploadError;
    const { data: publicUrl } = admin.storage.from("company-logos").getPublicUrl(path);
    const { error: logoError } = await admin.from("client_profiles").update({ logo_url: publicUrl.publicUrl }).eq("user_id", user.id);
    if (logoError) { await admin.storage.from("company-logos").remove([path]); throw logoError; }
  }
  revalidatePath("/workspace/client");
  revalidatePath("/workspace/client/company");
}


export async function completeClientOnboardingAction(formData: FormData) {
  const { user } = await requireRole("client");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();
  const hiringNeeds = String(formData.get("hiring_needs") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const budgetMin = Number(formData.get("budget_min") ?? 0);
  const budgetMax = Number(formData.get("budget_max") ?? 0);
  if (fullName.length < 2 || companyName.length < 2 || timezone.length < 2 || hiringNeeds.length < 20) throw new Error("Complete the required onboarding details.");
  if (!Number.isFinite(budgetMin) || budgetMin < MIN_HOURLY_RATE || !Number.isFinite(budgetMax) || budgetMax < budgetMin) throw new Error("Enter a valid hiring budget range.");
  const admin = createAdminClient();
  const { error: profileError } = await admin.from("profiles").update({ full_name: fullName }).eq("id", user.id);
  if (profileError) throw profileError;
  const { error: companyError } = await admin.from("client_profiles").update({ company_name: companyName, timezone, hiring_needs: hiringNeeds, hiring_notes: hiringNeeds, location: location || null, budget_min: budgetMin, budget_max: budgetMax, onboarding_completed_at: new Date().toISOString() }).eq("user_id", user.id);
  if (companyError) throw companyError;
  try { await admin.from("analytics_events").insert({ event_name: "client_onboarding_completed", path: "/workspace/client/onboarding", user_id: user.id, metadata: { budget_min: budgetMin, budget_max: budgetMax } }); } catch {}
  redirect("/workspace/client/jobs/new?onboarded=1");
}
