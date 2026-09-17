import Link from "next/link";
import { Clock3, MessageSquare, UsersRound } from "lucide-react";
import { sendClientShortlistFollowupAction } from "@/app/actions/client-shortlist";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { elapsedLabel } from "@/lib/format";
import type { JobSummaryRow } from "@/lib/workspace-rows";

type ReleasedShortlistRow = { job_id: string; va_id: string; released_at: string | null; client_decision: string | null; client_decision_note: string | null; client_decision_at: string | null };
type ShortlistActivityRow = { subject_id: string; action: string; created_at: string };

const HOUR = 60 * 60 * 1000;
const ageLabel = (value?: string | null) => elapsedLabel(value, { empty: "Not recorded", underHour: "less than 1 hour ago" });


export default async function RecruiterClientReviewPage() {
  await requireRole("recruiter");
  const admin = createAdminClient();
  const { data: released } = await admin.from("job_shortlist_candidates").select("job_id,va_id,released_at,client_decision,client_decision_note,client_decision_at").eq("shortlist_status", "released").order("released_at", { ascending: true }).limit(250);
  const rows = (released || []) as ReleasedShortlistRow[];
  const jobIds = [...new Set(rows.map((row) => row.job_id))];
  if (!jobIds.length) return <><div className="page-head"><div><h1>Waiting for client</h1><p>Released recruiter shortlists and the client decisions they are blocking.</p></div></div><div className="card empty"><UsersRound size={24}/><h3>No released shortlists are waiting.</h3><p>Send reviewed VAs to a client from the role matching workspace.</p><Link className="btn btn-primary" href="/workspace/recruiter/matching">Open roles</Link></div></>;

  const [{ data: jobs }, { data: activity }] = await Promise.all([
    admin.from("jobs").select("id,title,company_name,client_id,status").in("id", jobIds),
    admin.from("recruiter_activity").select("subject_id,action,created_at").eq("subject_type", "job").in("subject_id", jobIds).in("action", ["client_shortlist_viewed", "client_shortlist_followup"]).order("created_at", { ascending: false }).limit(500)
  ]);
  const activeJobs=((jobs||[]) as (JobSummaryRow & { client_id: string | null })[]).filter((job)=>job.status!=="closed");
  const activityRows=(activity||[]) as ShortlistActivityRow[];
  const groups=activeJobs.map((job)=>{
    const shortlist=rows.filter((row)=>row.job_id===job.id);
    const decisions=shortlist.filter((row)=>row.client_decision);
    const passed=shortlist.filter((row)=>row.client_decision==="pass").length;
    const interested=shortlist.filter((row)=>row.client_decision==="interested").length;
    const interviews=shortlist.filter((row)=>row.client_decision==="interview").length;
    const viewed=activityRows.find((row)=>row.subject_id===job.id&&row.action==="client_shortlist_viewed")?.created_at||null;
    const followup=activityRows.find((row)=>row.subject_id===job.id&&row.action==="client_shortlist_followup")?.created_at||null;
    const oldest=shortlist.map((row)=>row.released_at).filter(Boolean).sort()[0]||null;
    const hoursWaiting=oldest?Math.max(0,(Date.now()-new Date(oldest).getTime())/HOUR):0;
    const allPassed=Boolean(shortlist.length&&passed===shortlist.length);
    const status=allPassed?"Needs replacement matches":interviews?"Interview requested":interested?"Client interested":decisions.length===shortlist.length?"Feedback complete":viewed?"Viewed, waiting on decisions":"Sent, not viewed";
    return {job,shortlist,decisions,passed,interested,interviews,viewed,followup,oldest,hoursWaiting,allPassed,status};
  }).sort((a,b)=>Number(b.allPassed)-Number(a.allPassed)||b.hoursWaiting-a.hoursWaiting);

  const waiting=groups.filter((group)=>group.decisions.length<group.shortlist.length).length;
  const replacement=groups.filter((group)=>group.allPassed).length;
  return <>
    <div className="page-head"><div><h1>Waiting for client</h1><p>See what was sent, whether the client viewed it, their decisions, and where a recruiter follow-up is due.</p></div><Link className="btn" href="/workspace/recruiter/matching">Back to roles</Link></div>
    <div className="matching-summary-grid" style={{marginBottom:16}}><div className="matching-summary-card"><span>Roles waiting</span><strong>{waiting}</strong><small>Incomplete client decisions</small></div><div className="matching-summary-card"><span>Need replacements</span><strong>{replacement}</strong><small>Client passed on all sent VAs</small></div><div className="matching-summary-card"><span>Active client reviews</span><strong>{groups.length}</strong><small>Released shortlists</small></div></div>
    <div className="stack">{groups.map((group)=>{
      const unresolved=group.shortlist.length-group.decisions.length;
      const followupRecent=group.followup&&Date.now()-new Date(group.followup).getTime()<20*HOUR;
      const followupDue=unresolved>0&&group.hoursWaiting>=24&&!followupRecent;
      return <article className="card" key={group.job.id}>
        <div className="row-between wrap"><div><div className="small muted">{group.job.company_name||"Client role"}</div><h2 style={{margin:"4px 0"}}>{group.job.title}</h2><div className="row wrap"><span className={`badge ${group.interviews||group.interested?"badge-success":group.allPassed?"badge-warning":""}`}>{group.status}</span><span className="small muted"><Clock3 size={13}/> Sent {ageLabel(group.oldest)}</span>{group.viewed?<span className="small muted">Viewed {ageLabel(group.viewed)}</span>:null}</div></div><div className="row wrap"><Link className="btn btn-sm" href={`/workspace/recruiter/matching/${group.job.id}`}>{group.allPassed?"Find replacement matches":"Open matching"}</Link>{unresolved>0?<form action={sendClientShortlistFollowupAction}><input type="hidden" name="job_id" value={group.job.id}/><input type="hidden" name="return_to" value="/workspace/recruiter/client-review"/><button className={`btn btn-sm ${followupDue?"btn-primary":""}`} type="submit" disabled={Boolean(followupRecent)}><MessageSquare size={14}/>{followupRecent?"Follow-up sent":followupDue?"Send follow-up":"Follow up"}</button></form>:null}</div></div>
        <div className="row wrap" style={{marginTop:12}}><span className="badge">{group.shortlist.length} sent</span><span className="badge">{unresolved} waiting</span><span className="badge">{group.interested} interested</span><span className="badge">{group.interviews} interview</span><span className="badge">{group.passed} passed</span></div>
      </article>;
    })}</div>
  </>;
}
