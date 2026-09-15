import Link from "next/link";
import { LockKeyhole, Sparkles, UsersRound } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { candidateAccessLabel, candidateAccessUnlocked } from "@/lib/candidate-access";
import { matchAssessment } from "@/lib/matching";
import { hideShortlistCandidateAction, saveJobShortlistAction, updateCandidateAccessAction } from "@/app/actions/matching";
import { markVaAvailabilityConfirmedAction, requestVaAvailabilityConfirmationAction, saveClientRecommendationAction } from "@/app/actions/client-shortlist";
import { MatchingCandidateTable } from "@/components/matching-candidate-table";

type Props = {
  job: any;
  viewerRole: "admin" | "recruiter";
  returnTo: string;
};

const MS_DAY = 24 * 60 * 60 * 1000;

export async function StaffJobMatching({ job, viewerRole, returnTo }: Props) {
  const admin = createAdminClient();
  const [{ data: vettingRows }, { data: shortlistRows }, { data: access }, { count: applicationsCount }, { data: settings }] = await Promise.all([
    admin.from("va_vetting").select("va_id,stage").in("stage", ["approved", "bench"]),
    admin.from("job_shortlist_candidates").select("va_id,match_score,match_confidence,shortlist_status,client_recommendation,client_decision,client_decision_note,client_decision_at,released_at").eq("job_id", job.id),
    admin.from("job_candidate_access").select("*").eq("job_id", job.id).maybeSingle(),
    admin.from("applications").select("id", { count: "exact", head: true }).eq("job_id", job.id),
    admin.from("admin_settings").select("default_candidate_access_fee").eq("id",1).maybeSingle()
  ]);

  const ids = [...new Set((vettingRows || []).map((row: any) => row.va_id))];
  const [{ data: profiles }, { data: vas }, { data: releasedAcross }, { data: processRows }, { data: activeJobs }] = ids.length
    ? await Promise.all([
        admin.from("profiles").select("id,full_name,avatar_url").in("id", ids),
        admin.from("va_profiles").select("*").in("user_id", ids),
        admin.from("job_shortlist_candidates").select("job_id,va_id,client_decision").in("va_id", ids).eq("shortlist_status", "released"),
        admin.from("applications").select("job_id,va_id,status").in("va_id", ids).in("status", ["interview", "offered", "hired"]),
        admin.from("jobs").select("id,title,hours_per_week,status").neq("status", "closed")
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }, { data: [] as any[] }, { data: [] as any[] }, { data: [] as any[] }];

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
  const shortlistMap = new Map((shortlistRows || []).map((row: any) => [row.va_id, row]));
  const activeJobMap = new Map((activeJobs || []).map((row: any) => [row.id, row]));
  const now = Date.now();
  const pool = (vas || []).map((va: any) => {
    const assessment = matchAssessment(job, va);
    const account = profileMap.get(va.user_id) as any;
    const shortlist = shortlistMap.get(va.user_id) as any;
    const confirmedAt = va.availability_confirmed_at ? new Date(va.availability_confirmed_at).getTime() : NaN;
    const availabilityAgeDays = Number.isFinite(confirmedAt) ? Math.max(0, Math.floor((now - confirmedAt) / MS_DAY)) : null;
    const otherClientReviews = (releasedAcross || []).filter((row: any) => row.va_id === va.user_id && row.job_id !== job.id && row.client_decision !== "pass" && activeJobMap.has(row.job_id)).length;
    const activeProcesses = (processRows || []).filter((row: any) => row.va_id === va.user_id && row.job_id !== job.id && activeJobMap.has(row.job_id));
    const potentialCommittedHours = activeProcesses.filter((row: any) => ["offered", "hired"].includes(row.status)).reduce((sum: number, row: any) => sum + Number((activeJobMap.get(row.job_id) as any)?.hours_per_week || 0), 0);
    return { va, account, shortlist, job, ...assessment, availabilityAgeDays, availabilityFresh: availabilityAgeDays != null && availabilityAgeDays <= 30, otherClientReviews, activeProcessCount: activeProcesses.length, potentialCommittedHours };
  }).sort((a: any, b: any) => {
    const availability = Number(b.va.availability_status === "available") - Number(a.va.availability_status === "available");
    return b.score - a.score || b.confidence - a.confidence || availability || Number(b.va.years_experience || 0) - Number(a.va.years_experience || 0);
  });

  const proposedCount = (shortlistRows || []).filter((row: any) => row.shortlist_status === "proposed").length;
  const releasedCount = (shortlistRows || []).filter((row: any) => row.shortlist_status === "released").length;
  const awaitingClientCount = (shortlistRows || []).filter((row: any) => row.shortlist_status === "released" && !row.client_decision).length;
  const unlocked = candidateAccessUnlocked(access?.access_status);
  const recommended = pool.filter((row:any)=>row.score>=60).slice(0,3);

  return <section className="card staff-matching-card">
    <div className="row-between wrap staff-matching-head">
      <div>
        <div className="row wrap"><Sparkles size={18}/><h2>Match this role</h2></div>
        <p className="muted">Step 1: review the brief. Step 2: choose from approved Virtual Assistants. Step 3: keep the shortlist internal or send the reviewed VAs to the client for review.</p>
      </div>
      <div className="row wrap">
        <span className="badge">{pool.length} vetted Virtual Assistants assessed</span>
        <span className="badge">{applicationsCount || 0} applications</span>
        {viewerRole === "recruiter" ? <Link className="btn btn-sm" href="/workspace/recruiter/client-review">Waiting for client{awaitingClientCount ? ` · ${awaitingClientCount}` : ""}</Link> : null}
      </div>
    </div>

    <div className="matching-workflow-steps"><span className="done">1. Understand role</span><span className="current">2. Choose reviewed VAs</span><span>3. Client review</span></div>
    {recommended.length?<div className="recommended-match-panel"><div><span className="small">Recommended action</span><h3>Start with the strongest {recommended.length} matches</h3><p>They have the best fit across the role’s category, required skills, tools, hours, and overlap requirements. Check availability freshness and client conflicts before sending.</p></div><div className="recommended-match-names">{recommended.map((row:any)=><span key={row.va.user_id}><strong>{row.account?.full_name||"Virtual Assistant candidate"}</strong> · {row.score}% match</span>)}</div></div>:null}

    <div className="matching-summary-grid">
      <div className="matching-summary-card"><span>Internal shortlist</span><strong>{proposedCount}</strong><small>Recruiter-only</small></div>
      <div className="matching-summary-card"><span>Client review</span><strong>{releasedCount}</strong><small>{awaitingClientCount ? `${awaitingClientCount} waiting on feedback` : "Sent to the client"}</small></div>
      <div className="matching-summary-card"><span>Client candidate access</span><strong className={unlocked ? "access-active-text" : ""}>{candidateAccessLabel(access?.access_status)}</strong><small>{access?.access_fee != null ? `USD ${Number(access.access_fee).toFixed(2)}` : "No access fee set"}</small></div>
    </div>

    {viewerRole === "admin" ? <details className="candidate-access-admin" open={access?.access_status === "requested"}>
      <summary><LockKeyhole size={16}/> Candidate access & billing</summary>
      <form action={updateCandidateAccessAction} className="candidate-access-form">
        <input type="hidden" name="job_id" value={job.id}/>
        <div className="field"><label htmlFor={`access-status-${job.id}`}>Access status</label><select id={`access-status-${job.id}`} name="access_status" defaultValue={access?.access_status || "locked"}><option value="locked">Locked</option><option value="requested">Requested</option><option value="quoted">Quoted</option><option value="invoiced">Invoiced</option><option value="paid">Paid — unlock</option><option value="comped">Comped — unlock</option></select></div>
        <div className="field"><label htmlFor={`access-fee-${job.id}`}>Candidate access fee, USD</label><input id={`access-fee-${job.id}`} type="number" name="access_fee" min="0" step="25" defaultValue={access?.access_fee ?? settings?.default_candidate_access_fee ?? ""} placeholder="Example: 199"/></div>
        <div className="field"><label htmlFor={`payment-ref-${job.id}`}>Invoice / payment reference</label><input id={`payment-ref-${job.id}`} name="payment_reference" defaultValue={access?.payment_reference || ""} placeholder="Optional invoice or Stripe reference"/></div>
        <div className="field candidate-access-notes"><label htmlFor={`access-notes-${job.id}`}>Internal note</label><input id={`access-notes-${job.id}`} name="notes" defaultValue={access?.notes || ""} placeholder="Optional note"/></div>
        <button className="btn btn-primary" type="submit">Save access status</button>
      </form>
      <p className="small muted">Paid or comped unlocks applicant identity, private profile evidence, resumes, comparison, messaging, and hiring actions. Quoted/invoiced states keep those details protected.</p>
    </details> : <div className={`info-banner ${unlocked ? "access-active-banner" : ""}`}><strong>Client access:</strong> {candidateAccessLabel(access?.access_status)}{access?.access_fee != null ? ` · USD ${Number(access.access_fee).toFixed(2)}` : ""}. Recruiters can curate and send reviewed talent to the client; billing status is controlled by Admin.</div>}

    {pool.length ? <form action={saveJobShortlistAction} className="staff-match-form">
      <input type="hidden" name="job_id" value={job.id}/>
      <input type="hidden" name="return_to" value={returnTo}/>
      <div className="row-between wrap shortlist-controls">
        <div><strong>Reviewed candidates</strong><div className="small muted">Only approved or bench VAs appear here. Select the people you want for this role. Add a client-facing recommendation where useful, confirm availability if it is stale, and check conflict warnings. “Save internal shortlist” keeps them recruiter-only; “Send selected for client review” makes the curated shortlist available in the client workspace.{!job.client_id ? " This role has no linked client account yet, so it can only be saved internally until it's linked." : ""}</div></div>
        <div className="row wrap"><button className="btn" type="submit" name="mode" value="save">Save internal shortlist</button><button className="btn btn-primary" type="submit" name="mode" value="release" disabled={!job.client_id} title={!job.client_id ? "Link this role to a client account first." : undefined}>Send selected for client review</button></div>
      </div>
      <MatchingCandidateTable pool={pool} hideShortlistCandidateAction={hideShortlistCandidateAction} saveClientRecommendationAction={saveClientRecommendationAction} requestVaAvailabilityConfirmationAction={requestVaAvailabilityConfirmationAction} markVaAvailabilityConfirmedAction={markVaAvailabilityConfirmedAction}/>
    </form> : <div className="empty"><UsersRound size={22}/><p>No approved or bench Virtual Assistants are available to assess yet.</p></div>}
  </section>;
}