import { MIN_HOURLY_RATE } from "./constants";
import { getVaCompletion } from "./profile-completeness";
import { PUBLIC_VA_MIN_EXPERIENCE } from "./public-routing";
import type { VaProfile } from "./types";

/**
 * The single definition of "can this profile appear publicly".
 *
 * It used to be written out four times -- in the public_va_directory view, in
 * the VA's own publish action, in the auto-hide check after a profile edit, and
 * in the checklist the VA reads on their dashboard. They drifted, so a VA could
 * be told they were ready and then be refused, or be hidden for a reason the
 * checklist never mentioned.
 *
 * The rule is now: an approved VA with a photo and a profile at 80% or better.
 * Individual fields (resume, bio length, skill count, headline, weekly hours)
 * are no longer separate gates -- they are already priced into the completion
 * score, and requiring them twice was blocking people for no added quality.
 *
 * Experience and rate stay as explicit gates because they are published
 * promises rather than profile completeness: the site states a two-year
 * minimum, and $5/hour is the platform floor for ongoing hourly roles.
 *
 * public_va_directory enforces the same rule in SQL and is the real authority;
 * keep the two in step.
 */
export const PUBLIC_VA_MIN_COMPLETION = 80;

export type VisibilityRequirement = { label: string; done: boolean };

export function publicVisibilityRequirements(
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
 * The approval bar, for rows out of recruiter_va_directory.
 *
 * Deliberately the same bar as publishing: a photo and a profile at
 * PUBLIC_VA_MIN_COMPLETION. It used to be 90% plus "nothing missing except
 * portfolio or tools", which meant a recruiter could approve someone the
 * directory would then refuse to list, or skip someone the directory would
 * have accepted. Approving and publishing now succeed or fail together.
 */
export function isRowApprovable(row: { completion_score?: number | null; missing_items?: unknown }) {
  const missing = Array.isArray(row.missing_items) ? row.missing_items.map(String) : [];
  const hasPhoto = !missing.includes("photo");
  return Number(row.completion_score || 0) >= PUBLIC_VA_MIN_COMPLETION && hasPhoto;
}
