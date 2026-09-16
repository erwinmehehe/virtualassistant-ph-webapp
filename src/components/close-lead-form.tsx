import { closeLeadAction } from "@/app/actions/close-lead";

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
          <label>Close reason</label>
          <select name="reason" defaultValue="Spam" required>
            <option value="Spam">Spam</option>
            <option value="Duplicate inquiry">Duplicate inquiry</option>
            <option value="No response">No response</option>
            <option value="Not a fit">Not a fit</option>
            <option value="Budget">Budget</option>
            <option value="Timing">Timing</option>
            <option value="Hired elsewhere">Hired elsewhere</option>
            <option value="Other">Other</option>
          </select>
        </div>
        {hasLinkedRole ? (
          <label className="row wrap small">
            <input type="checkbox" name="close_linked_role" value="1" defaultChecked/>
            Close the linked role too
          </label>
        ) : null}
        <div className="row wrap">
          <button className="btn btn-sm" type="submit">Close lead</button>
          <span className="small muted">Moves the lead to Lost, clears follow-up, and keeps the CRM history.</span>
        </div>
      </form>
    </details>
  );
}
