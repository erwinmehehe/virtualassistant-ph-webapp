import { Globe2, LockKeyhole, Star } from "lucide-react";
import { submitPlacementReviewAction } from "@/app/actions/workroom";
import { ReviewVisibilityBadge, ReviewVisibilityExplanation } from "@/components/review-visibility";
import type { PlacementReview, ReviewVisibility } from "@/lib/reviews";

function Stars({ rating }: { rating: number }) {
  const safe = Math.max(0, Math.min(5, Number(rating) || 0));
  return <span className="review-stars" aria-label={`${safe} out of 5 stars`}>{Array.from({length:5},(_,i)=><Star key={i} size={15} className={i < safe ? "filled" : ""}/>)}</span>;
}

export function PlacementReviewPanel({
  workroomId,
  viewerRole,
  counterpartyLabel,
  ownReview,
  receivedReview,
  vaProfileIsPublic = false
}: {
  workroomId: string;
  viewerRole: "client" | "va";
  counterpartyLabel: string;
  ownReview?: PlacementReview | null;
  receivedReview?: PlacementReview | null;
  vaProfileIsPublic?: boolean;
}) {
  const currentVisibility: ReviewVisibility = ownReview?.visibility || "contract";
  const clientReview = viewerRole === "client";
  const receivedLabel = viewerRole === "client" ? "VA review of this placement" : "Client review of this placement";
  return <section className="card placement-review-card">
    <div className="placement-review-head">
      <div><h3>{ownReview ? "Your placement review" : `Review ${counterpartyLabel}`}</h3><p>Reviews are tied to this confirmed placement, so the visibility state is always clear before and after you save.</p></div>
      {ownReview ? <ReviewVisibilityBadge visibility={currentVisibility} vaProfileIsPublic={vaProfileIsPublic}/> : null}
    </div>

    <form action={submitPlacementReviewAction} className="stack placement-review-form">
      <input type="hidden" name="workroom_id" value={workroomId}/>
      <div className="field"><label>Rating</label><div className="review-rating-options">
        {[5,4,3,2,1].map((rating)=><label key={rating}><input type="radio" name="rating" value={rating} defaultChecked={(ownReview?.rating || 5) === rating}/><span><Stars rating={rating}/><strong>{rating}/5</strong></span></label>)}
      </div></div>
      <div className="field"><label htmlFor={`review-body-${workroomId}`}>Review</label><textarea id={`review-body-${workroomId}`} name="body" minLength={10} maxLength={1600} required defaultValue={ownReview?.body || ""} placeholder={clientReview ? "Share specific feedback about communication, reliability, role fit, and the work you completed together." : "Share specific feedback about the working relationship, clarity, communication, and support during this placement."}/><span className="field-help">10–1,600 characters. Avoid contact details or confidential client information.</span></div>

      {clientReview ? <fieldset className="review-visibility-fieldset"><legend>Who can see this review?</legend><div className="review-visibility-options">
        <label className="review-visibility-option"><input type="radio" name="visibility" value="public" defaultChecked={currentVisibility === "public"}/><span className="review-visibility-icon"><Globe2 size={18}/></span><span><strong>Public on the VA profile</strong><small>{vaProfileIsPublic ? "Visible on the VA's public profile as soon as you save it." : "Saved as public, but it will appear publicly only when this VA has a published profile."}</small></span></label>
        <label className="review-visibility-option"><input type="radio" name="visibility" value="contract" defaultChecked={currentVisibility === "contract"}/><span className="review-visibility-icon"><LockKeyhole size={18}/></span><span><strong>Contract parties only</strong><small>Only you and this VA can read it. It never appears on public pages.</small></span></label>
      </div></fieldset> : <><input type="hidden" name="visibility" value="contract"/><ReviewVisibilityExplanation visibility="contract" vaProfileIsPublic={false}/></>}

      {ownReview && clientReview ? <ReviewVisibilityExplanation visibility={currentVisibility} vaProfileIsPublic={vaProfileIsPublic}/> : null}
      <div className="row-between wrap placement-review-actions"><span className="small muted">You can update this review later from the same workroom.</span><button className="btn btn-primary" type="submit">{ownReview ? "Update review" : "Save review"}</button></div>
    </form>

    <div className="received-review-block"><div className="row-between wrap"><strong>{receivedLabel}</strong>{receivedReview ? <ReviewVisibilityBadge visibility={receivedReview.visibility} vaProfileIsPublic={vaProfileIsPublic}/> : null}</div>{receivedReview ? <div className="received-review-content"><Stars rating={receivedReview.rating}/><p>{receivedReview.body}</p></div> : <p className="small muted">No review has been submitted by the other party yet.</p>}</div>
  </section>;
}
