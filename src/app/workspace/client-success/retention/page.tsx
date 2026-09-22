import Link from "next/link";
import { AlertTriangle, CalendarClock, RefreshCw, ShieldCheck } from "lucide-react";
import { requireAnyRoleFast } from "@/lib/auth";
import { savePlacementRetentionAction, saveReplacementWorkflowAction } from "@/app/actions/replacement-retention";
import { resolvePlacementSupportRequestAction } from "@/app/actions/placement-support";
import { getClientSuccessRetentionSummary, type ClientSuccessReplacement, type ClientSuccessRetentionRoom } from "@/lib/client-success-dashboard";

const REPLACEMENT_REASONS = [
  ["performance", "Performance"],
  ["attendance_reliability", "Attendance / reliability"],
  ["skills_fit", "Skills fit"],
  ["communication", "Communication"],
  ["schedule_timezone", "Schedule / timezone"],
  ["role_changed", "Role changed"],
  ["working_style", "Working style"],
  ["va_unavailable", "VA unavailable"],
  ["other", "Other"],
] as const;
const GUARANTEE_STATUSES = [
  ["not_reviewed", "Not reviewed"],
  ["eligible", "Eligible"],
  ["not_eligible", "Not eligible"],
  ["approved", "Approved"],
  ["declined", "Declined"],
] as const;
const RENEWAL_STATUSES = [
  ["not_set", "Not set"],
  ["upcoming", "Upcoming"],
  ["renewed", "Renewed"],
  ["not_renewing", "Not renewing"],
] as const;
const END_REASONS = [
  ["", "No end reason"],
  ["completed", "Planned completion"],
  ["client_cancelled", "Client cancelled"],
  ["va_resigned", "VA resigned"],
  ["performance", "Performance"],
  ["attendance_reliability", "Attendance / reliability"],
  ["budget", "Budget"],
  ["role_changed", "Role changed"],
  ["business_change", "Business change"],
  ["replacement", "Replacement"],
  ["other", "Other"],
] as const;

function label(value: string | null | undefined) {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function RetentionAndReplacementPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const query = await searchParams;
  const { userId } = await requireAnyRoleFast(["admin", "recruiter"]);
  const { data, error } = await getClientSuccessRetentionSummary(userId);
  if (error) throw error;

  const visibleRooms = data.rooms as ClientSuccessRetentionRoom[];
  const replacements = data.replacements as ClientSuccessReplacement[];

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const activeReplacements = replacements.filter((request) => ["open", "acknowledged"].includes(request.status));
  const overdueReplacements = activeReplacements.filter((request) => request.replacement_sla_due_on && request.replacement_sla_due_on < today);
  const renewalsDue = visibleRooms.filter((room) => room.placement_stage !== "ended" && room.renewal_date && room.renewal_date >= today && room.renewal_date <= thirtyDays);
  const notRenewing = visibleRooms.filter((room) => room.renewal_status === "not_renewing");

  return <>
    {query.replacement_saved ? <div className="success-banner" role="status">Replacement plan saved.</div> : null}
    {query.retention_saved ? <div className="success-banner" role="status">Retention details saved.</div> : null}
    {query.support_saved ? <div className="success-banner" role="status">Replacement request status updated.</div> : null}
    <div className="page-head">
      <div><div className="kicker">Client Success</div><h1>Retention &amp; replacements</h1><p>Run replacement cases against a clear SLA, record guarantee decisions, and keep renewal or offboarding decisions visible before they become churn surprises.</p></div>
      <div className="row wrap"><Link className="btn" href="/workspace/client-success">Placement queue</Link><Link className="btn" href="/workspace/client-success/support">All support requests</Link></div>
    </div>

    <div className="grid-4">
      <div className="card"><span className="small muted">Open replacements</span><strong style={{display:"block",fontSize:28}}>{activeReplacements.length}</strong></div>
      <div className="card"><span className="small muted">SLA overdue</span><strong style={{display:"block",fontSize:28}}>{overdueReplacements.length}</strong></div>
      <div className="card"><span className="small muted">Renewals next 30 days</span><strong style={{display:"block",fontSize:28}}>{renewalsDue.length}</strong></div>
      <div className="card"><span className="small muted">Not renewing</span><strong style={{display:"block",fontSize:28}}>{notRenewing.length}</strong></div>
    </div>

    <section className="card" style={{marginTop:18}}>
      <div className="row-between wrap"><div><h2 style={{margin:0}}>Replacement queue</h2><p className="small muted" style={{margin:"5px 0 0"}}>Every active case needs a reason, due date, and explicit guarantee review. No guarantee rule is inferred automatically.</p></div><RefreshCw size={20}/></div>
      {replacements.length ? <div className="stack" style={{marginTop:14}}>{replacements.map((request) => {
        const active = ["open", "acknowledged"].includes(request.status);
        const overdue = active && request.replacement_sla_due_on && request.replacement_sla_due_on < today;
        return <article className="card" key={request.id}>
          <div className="row-between wrap"><div><div className="row wrap"><span className={`badge ${overdue ? "badge-danger" : active ? "badge-warning" : "badge-success"}`}>{request.status}</span>{overdue ? <span className="badge badge-danger">SLA overdue</span> : null}{request.replacement_sla_due_on ? <span className="badge"><CalendarClock size={12}/> Due {request.replacement_sla_due_on}</span> : <span className="badge badge-warning">SLA not set</span>}</div><h3 style={{margin:"8px 0 3px"}}>{request.job_title || "Placement"}</h3><p className="small muted" style={{margin:0}}>{request.company_name || request.client_name || "Client"} · {request.va_name || "Virtual Assistant"}</p></div><Link className="btn btn-sm" href={`/workspace/client-success/${request.workroom_id}`}>Open placement</Link></div>
          <p>{request.details}</p>
          {active ? <>
            <form action={saveReplacementWorkflowAction} className="stack" style={{marginTop:12}}>
              <input type="hidden" name="request_id" value={request.id}/><input type="hidden" name="workroom_id" value={request.workroom_id}/><input type="hidden" name="return_to" value="/workspace/client-success/retention"/>
              <div className="form-grid">
                <div className="field"><label>Replacement reason</label><select name="replacement_reason" defaultValue={request.replacement_reason || ""} required><option value="">Choose reason</option>{REPLACEMENT_REASONS.map(([value,text]) => <option value={value} key={value}>{text}</option>)}</select></div>
                <div className="field"><label>Replacement SLA due</label><input type="date" name="replacement_sla_due_on" defaultValue={request.replacement_sla_due_on || ""} required/></div>
                <div className="field"><label>Guarantee review</label><select name="guarantee_status" defaultValue={request.guarantee_status || "not_reviewed"}>{GUARANTEE_STATUSES.map(([value,text]) => <option value={value} key={value}>{text}</option>)}</select></div>
                <div className="field span-2"><label>Guarantee / replacement notes</label><textarea name="guarantee_notes" maxLength={2000} defaultValue={request.guarantee_notes || ""} placeholder="Record what applies under the agreed service terms. Do not assume eligibility."/></div>
              </div>
              <button className="btn btn-primary" type="submit">Save replacement plan</button>
            </form>
            <form action={resolvePlacementSupportRequestAction} className="stack" style={{marginTop:12}}><input type="hidden" name="request_id" value={request.id}/><input type="hidden" name="workroom_id" value={request.workroom_id}/><div className="form-grid"><div className="field"><label>Case status</label><select name="status" defaultValue={request.status === "open" ? "acknowledged" : request.status}><option value="acknowledged">Acknowledge</option><option value="resolved">Resolve</option><option value="declined">Decline</option></select></div><div className="field span-2"><label>Outcome / next step</label><textarea name="resolution" maxLength={4000} defaultValue={request.resolution || ""} placeholder="Who owns the replacement search, what happens to the current placement, and what was agreed with the client?"/></div></div><button className="btn" type="submit">Save case status</button></form>
          </> : <div className="info-banner" style={{marginTop:12}}><ShieldCheck size={15}/><span>{request.resolution || `Closed replacement case · ${label(request.replacement_reason) || "reason not recorded"}`}</span></div>}
        </article>;
      })}</div> : <div className="empty">No replacement requests have been submitted.</div>}
    </section>

    <section className="card" style={{marginTop:18}}>
      <div className="row-between wrap"><div><h2 style={{margin:0}}>Renewal &amp; offboarding register</h2><p className="small muted" style={{margin:"5px 0 0"}}>Keep the next commercial decision and any exit reason on the placement record, not in private messages.</p></div><ShieldCheck size={20}/></div>
      {visibleRooms.length ? <div className="stack" style={{marginTop:14}}>{visibleRooms.slice(0,80).map((room) => {return <article className="card" key={room.id}>
        <div className="row-between wrap"><div><div className="row wrap"><span className="badge">{label(room.placement_stage)}</span><span className="badge">{label(room.renewal_status || "not_set")}</span>{room.renewal_date?<span className="badge"><CalendarClock size={12}/> {room.renewal_date}</span>:null}</div><h3 style={{margin:"8px 0 3px"}}>{room.job_title||"Placement"}</h3><p className="small muted" style={{margin:0}}>{room.company_name||room.client_name||"Client"} · {room.va_name||"Virtual Assistant"}</p></div><Link className="btn btn-sm" href={`/workspace/client-success/${room.id}`}>Open placement</Link></div>
        <form action={savePlacementRetentionAction} className="stack" style={{marginTop:12}}><input type="hidden" name="workroom_id" value={room.id}/><input type="hidden" name="return_to" value="/workspace/client-success/retention"/><div className="form-grid"><div className="field"><label>Renewal status</label><select name="renewal_status" defaultValue={room.renewal_status||"not_set"}>{RENEWAL_STATUSES.map(([value,text])=><option value={value} key={value}>{text}</option>)}</select></div><div className="field"><label>Renewal / decision date</label><input type="date" name="renewal_date" defaultValue={room.renewal_date||""}/></div><div className="field"><label>End reason</label><select name="end_reason" defaultValue={room.end_reason||""}>{END_REASONS.map(([value,text])=><option value={value} key={value}>{text}</option>)}</select></div><div className="field span-2"><label>Offboarding / retention notes</label><textarea name="offboarding_notes" maxLength={4000} defaultValue={room.offboarding_notes||""} placeholder="Renewal discussion, save plan, exit context, handover, client feedback, or redeployment notes."/></div></div><button className="btn" type="submit">Save retention record</button></form>
      </article>})}</div> : <div className="empty"><AlertTriangle size={20}/>No placements are available.</div>}
    </section>
  </>;
}
