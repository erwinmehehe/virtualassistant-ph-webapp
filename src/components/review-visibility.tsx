import { Clock3, Globe2, LockKeyhole } from "lucide-react";
import { getReviewVisibilityState, reviewVisibilityDescription, reviewVisibilityLabel, type ReviewVisibility } from "@/lib/reviews";

export function ReviewVisibilityBadge({ visibility, vaProfileIsPublic = false }: { visibility: ReviewVisibility; vaProfileIsPublic?: boolean }) {
  const state = getReviewVisibilityState(visibility, vaProfileIsPublic);
  const Icon = state === "public_now" ? Globe2 : state === "public_when_profile_live" ? Clock3 : LockKeyhole;
  return <span className={`review-visibility-badge ${state}`}><Icon size={13}/>{reviewVisibilityLabel(state)}</span>;
}

export function ReviewVisibilityExplanation({ visibility, vaProfileIsPublic = false }: { visibility: ReviewVisibility; vaProfileIsPublic?: boolean }) {
  const state = getReviewVisibilityState(visibility, vaProfileIsPublic);
  return <div className={`review-visibility-explanation ${state}`}><ReviewVisibilityBadge visibility={visibility} vaProfileIsPublic={vaProfileIsPublic}/><p>{reviewVisibilityDescription(state)}</p></div>;
}
