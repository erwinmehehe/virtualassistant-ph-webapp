import { MIN_HOURLY_RATE } from "./constants";
import { getVaCompletion } from "./profile-completeness";
import { PUBLIC_VA_MIN_EXPERIENCE } from "./public-routing";
import { PUBLIC_PROFILE_CONSENT_VERSION } from "./privacy-consent";
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
    { label: "current public profile consent", done: profile?.public_profile_consent === true && Boolean(profile?.public_profile_consent_at) && !profile?.public_profile_consent_withdrawn_at && profile?.public_profile_consent_version === PUBLIC_PROFILE_CONSENT_VERSION }
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
 * The bar to approve a VA into the bench, deliberately lower than the public
 * one. An approved VA can be matched, shortlisted and put in front of a client
 * by a recruiter; none of that exposes them, because public_va_directory
 * separately requires a photo, PUBLIC_VA_MIN_COMPLETION, two years, a rate,
 * availability and explicit public-profile consent.
 *
 * Approving also protects the account: the abandoned-account cleanup skips
 * anyone at stage approved or bench.
 */
export const APPROVAL_MIN_COMPLETION = 60;

/**
 * Approval is a recruiter quality decision, not consent to public processing,
 * so this checks only that there is enough profile to judge. The photo stays a
 * public-listing requirement, not an approval one.
 */
export function isApprovalCompletionEligible(completionScore: number | null | undefined) {
  return Number(completionScore || 0) >= APPROVAL_MIN_COMPLETION;
}

export function approvalEligibility(row: { completion_score?: number | null; missing_items?: unknown }) {
  const completion = Number(row.completion_score || 0);
  return {
    eligible: isApprovalCompletionEligible(completion),
    completion,
    reason: completion >= APPROVAL_MIN_COMPLETION
      ? null
      : `Profile completion is ${completion}%. Approval requires at least ${APPROVAL_MIN_COMPLETION}%.`
  };
}

export function assertApprovalCompletion(completionScore: number | null | undefined) {
  const result = approvalEligibility({ completion_score: completionScore });
  if (!result.eligible) throw new Error(result.reason || `Approval requires at least ${APPROVAL_MIN_COMPLETION}% profile completion.`);
  return result;
}

export function isRowApprovable(row: { completion_score?: number | null; missing_items?: unknown }) {
  return approvalEligibility(row).eligible;
}
