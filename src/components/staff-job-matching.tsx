import { LockKeyhole, Sparkles, UsersRound } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { candidateAccessLabel, candidateAccessUnlocked } from "@/lib/candidate-access";
import { matchAssessment } from "@/lib/matching";
import { hideShortlistCandidateAction, saveJobShortlistAction, updateCandidateAccessAction } from "@/app/actions/matching";
import { MatchingCandidateTable } from "@/components/matching-candidate-table";

type Props = {
  job: any;
  viewerRole: "admin" | "recruiter";
  returnTo: string;
};

export async function StaffJobMatching({ job, viewerRole, returnTo }: Props) {
  const admin = createAdminClient();
  const [{ data: vettingRows }, { data: shortlistRows }, { data: access }, { count: applicationsCount }, { data: settings }] = await Promise.all([
    admin.from("va_vetting").select("va_id,stage").in("stage", ["approved", "bench"]),
    admin.from("job_shortlist_candidates").select("va_id,match_score,match_confidence,shortlist_status").eq("job_id", job.id),
    admin.from("job_candidate_access").select("*").eq("job_id", job.id).maybeSingle(),
    admin.from("applications").select("id", { count: "exact", head: true }).eq("job_id", job.id),
    admin.from("admin_settings").select("default_candidate_access_fee").eq("id",1).maybeSingle()
  ]);

  const ids = [...new Set((vettingRows || []).map((row: any) => row.va_id))];
  const [{ data: profiles }, { data: vas }] = ids.length
    ? await Promise.all([
        admin.from("profiles").select("id,full_name,avatar_url").in("id", ids),
        admin.from("va_profiles").select("*").in("user_id", ids)
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }];

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
  const shortlistMap = new Map((shortlistRows || []).map((row: any) => [row.va_id, row]));
  const pool = (vas || []).map((va: any) => {
    const assessment = matchAssessment(job, va);
    const account = profileMap.get(va.user_id) as any;
    const shortlist = shortlistMap.get(va.user_id) as any;
    return { va, account, shortlist, ...assessment };
  }).sort((a: any, b: any) => {
    const availability = Number(b.va.availability_status === "available") - Number(a.va.availability_status === "available");
    return b.score - a.score || b.confidence - a.confidence || availability || Number(b.va.years_experience || 0) - Number(a.va.years_experience || 0);
  });

  const proposedCount = (shortlistRows || []).filter((row: any) => row.shortlist_status === "proposed").length;
  const releasedCount = (shortlistRows || []).filter((row: any) => row.shortlist_status === "released").length;
  const unlocked = candidateAccessUnlocked(access?.access_status);

  return <section className="card staff-matching-card">
    <div className="row-between wrap staff-matching-head">
      <div>
        <div className="row wrap"><Sparkles size={18}/><h2>Pre-application matching</h2></div>
        <p className="muted">Runs the role against the full approved/bench VA pool. Scores are computed before anyone applies, so staff can curate a shortlist proactively.</p>
      </div>
      <div className="row wrap">
        <span className="badge">{pool.length} vetted VAs assessed</span>
        <span className="badge">{applicationsCount || 0} applications</span>
      </div>
    </div>

    <div className="matching-summary-grid">
      <div className="matching-summary-card"><span>Internal shortlist</span><strong>{proposedCount}</strong><small>Saved by staff</small></div>
      <div className="matching-summary-card"><span>Released shortlist</span><strong>{releasedCount}</strong><small>Prepared for client review</small></div>
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
    </details> : <div className={`info-banner ${unlocked ? "access-active-banner" : ""}`}><strong>Client access:</strong> {candidateAccessLabel(access?.access_status)}{access?.access_fee != null ? ` · USD ${Number(access.access_fee).toFixed(2)}` : ""}. Recruiters can curate/release talent; billing status is controlled by Admin.</div>}

    {pool.length ? <form action={saveJobShortlistAction} className="staff-match-form">
      <input type="hidden" name="job_id" value={job.id}/>
      <input type="hidden" name="return_to" value={returnTo}/>
      <div className="row-between wrap shortlist-controls">
        <div><strong>Ranked VA pool</strong><div className="small muted">Select candidates to save internally or release as a curated shortlist. Release does not expose identity until candidate access is active.{!job.client_id ? " This role has no linked client account yet, so it can only be saved internally until it's linked." : ""}</div></div>
        <div className="row wrap"><button className="btn" type="submit" name="mode" value="save">Save internal shortlist</button><button className="btn btn-primary" type="submit" name="mode" value="release" disabled={!job.client_id} title={!job.client_id ? "Link this role to a client account first." : undefined}>Release selected</button></div>
      </div>
      <MatchingCandidateTable pool={pool} hideShortlistCandidateAction={hideShortlistCandidateAction}/>
    </form> : <div className="empty"><UsersRound size={22}/><p>No approved or bench VAs are available to assess yet.</p></div>}
  </section>;
}
