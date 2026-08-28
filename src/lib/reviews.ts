export type ReviewVisibility = "public" | "contract";

export type PlacementReview = {
  id: string;
  workroom_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  body: string;
  visibility: ReviewVisibility;
  created_at: string;
  updated_at?: string | null;
};

export type ReviewVisibilityState = "public_now" | "public_when_profile_live" | "contract_only";

export function getReviewVisibilityState(visibility: ReviewVisibility, vaProfileIsPublic: boolean): ReviewVisibilityState {
  if (visibility === "contract") return "contract_only";
  return vaProfileIsPublic ? "public_now" : "public_when_profile_live";
}

export function reviewVisibilityLabel(state: ReviewVisibilityState) {
  if (state === "public_now") return "Public now";
  if (state === "public_when_profile_live") return "Public when profile is live";
  return "Contract only";
}

export function reviewVisibilityDescription(state: ReviewVisibilityState) {
  if (state === "public_now") return "This review appears on the VA's public profile. If that profile is unpublished later, the review becomes visible only to the contract parties until the profile is live again.";
  if (state === "public_when_profile_live") return "You chose public visibility, but the VA does not currently have a published public profile. Only you and the VA can see this review until the profile is live.";
  return "Only the client and VA from this placement can see this review. It will not appear on public profile pages.";
}
