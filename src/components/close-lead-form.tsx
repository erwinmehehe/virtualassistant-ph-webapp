"use client";

import { useFormStatus } from "react-dom";
import { closeLeadAction } from "@/app/actions/close-lead";
import { LEAD_LOSS_REASONS } from "@/lib/loss-reasons";

function CloseLeadSubmitButton() {
  const { pending } = useFormStatus();
  return <button className="btn btn-sm" type="submit" disabled={pending}>{pending ? "Closing..." : "Close lead"}</button>;
}

export function CloseLeadForm({
  leadId,
  returnTo,
  hasLinkedRole
}: {
  leadId: string;
  returnTo: string;
  hasLinkedRole: boolean;
}) {
  return (
    <details className="staff-followup-details">
      <summary className="btn btn-sm">Close lead</summary>
      <form action={closeLeadAction} className="stack staff-followup-form">
        <input type="hidden" name="lead_id" value={leadId}/>
        <input type="hidden" name="return_to" value={returnTo}/>
        <div className="field">
          <label>Why was this opportunity lost?</label>
          <select name="lost_reason_code" defaultValue="" required>
            <option value="" disabled>Choose a reason</option>
            {LEAD_LOSS_REASONS.map((reason) => <option key={reason.code} value={reason.code}>{reason.label}{reason.recoverable ? " · win-back" : ""}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Competitor <span className="small muted">(only when applicable)</span></label>
          <input name="lost_competitor" maxLength={200} placeholder="Company or alternative chosen"/>
        </div>
        <div className="field">
          <label>Internal detail <span className="small muted">(optional)</span></label>
          <input name="lost_reason_detail" maxLength={1000} placeholder="What specifically blocked the hire?"/>
        </div>
        {hasLinkedRole ? (
          <label className="row wrap small">
            <input type="checkbox" name="close_linked_role" value="1" defaultChecked/>
            Close the linked role too
          </label>
        ) : null}
        <div className="row wrap">
          <CloseLeadSubmitButton/>
          <span className="small muted">Recoverable reasons automatically schedule a recruiter win-back task.</span>
        </div>
      </form>
    </details>
  );
}
