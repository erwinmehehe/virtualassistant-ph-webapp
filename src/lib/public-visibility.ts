import { MIN_HOURLY_RATE } from "./constants";
import { getVaCompletion } from "./profile-completeness";
import { PUBLIC_VA_MIN_EXPERIENCE } from "./public-routing";
import type { VaProfile } from "./types";

export const PUBLIC_VA_MIN_COMPLETION = 80;

export type VisibilityRequirement = { label: string; done: boolean };

export function publicProfileContentRequirements(
  profile: Partial<VaProfile> | null | undefined,
  avatarUrl?: string | null
): VisibilityRequirement[] {
  const score = getVaCompletion(profile ?? null, avatarUrl).score;
  return [
    { label: "profile photo", done: Boolean(avatarUrl && String(avatarUrl).trim()) },
    { label: `profile at ${PUBLIC_VA_MIN_COMPLETION}%`, done: score >= PUBLIC_VA_MIN_COMPLETION },
    { label: `${PUBLIC_VA_MIN_EXPERIENCE}+ years experience`, done: Number(profile?.years_experience || 0) >= PUBLIC_VA_MIN_EXPERIENCE },
    { label: `rate of at least USD ${MIN_HOURLY_RATE}/hr`, done: Number(profile?.hourly_rate || 0) >= MIN_HOURLY_RATE },
    { label: "availability set to available", done: profile?.availability_status === "available" }
  ];
}

/** Public discovery also requires the VA's explicit, versioned opt-in. */
export function publicVisibilityRequirements(
  profile: Partial<VaProfile> | null | undefined,
  avatarUrl?: string | null
): VisibilityRequirement[] {
  return [
    ...publicProfileContentRequirements(profile, avatarUrl),
    { label: "public profile consent", done: profile?.public_profile_consent === true }
  ];
}

export function missingForPublic(profile: Partial<VaProfile> | null | undefined, avatarUrl?: string | null) {
  return publicVisibilityRequirements(profile, avatarUrl).filter((item) => !item.done).map((item) => item.label);
}

export function isPubliclyEligible(
  profile: Partial<VaProfile> | null | undefined,
  avatarUrl: string | null | undefined,
  stage: string | null | undefined
) {
  if (!profile || !["approved", "bench"].includes(stage || "")) return false;
  return publicVisibilityRequirements(profile, avatarUrl).every((item) => item.done);
}

/**
 * Approval is a recruiter quality decision, not consent to public processing.
 * Keep this bar focused on profile readiness; public_va_directory separately
 * requires explicit public-profile consent before any approved VA is exposed.
 */
export function isRowApprovable(row: { completion_score?: number | null; missing_items?: unknown }) {
  const missing = Array.isArray(row.missing_items) ? row.missing_items.map(String) : [];
  const hasPhoto = !missing.includes("photo");
  return Number(row.completion_score || 0) >= PUBLIC_VA_MIN_COMPLETION && hasPhoto;
}
