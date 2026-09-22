import Link from "next/link";
import { CalendarClock, ExternalLink, Video } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CandidateInterviewScheduler } from "@/components/candidate-interview-scheduler";
import type { CandidateInterviewRow, JobSummaryRow } from "@/lib/workspace-rows";
import { cancelCandidateInterviewAction, submitCandidateInterviewFeedbackAction } from "@/app/actions/recruiter-operations-system";
import { maskVaName } from "@/lib/va-identity";

function localLabel(value?:string|null,zone?:string|null){if(!value)return"Not scheduled";try{return new Intl.DateTimeFormat("en",{dateStyle:"full",timeStyle:"short",timeZone:zone||undefined}).format(new Date(value));}catch{return new Intl.DateTimeFormat("en",{dateStyle:"full",timeStyle:"short"}).format(new Date(value));}}

export default async function ClientInterviewsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const query=await searchParams;const {userId}=await requireRoleFast("client");const admin=createAdminClient();
  const {data:rowData,error}=await admin.from("candidate_interviews").select("*").eq("client_id",userId).order("created_at",{ascending:false}).limit(100);
  if(error)throw error;
  const rows=(rowData||[]) as CandidateInterviewRow[];
  const jobIds=[...new Set(rows.map((row)=>row.job_id))];const vaIds=[...new Set(rows.map((row)=>row.va_id))];
  const [{data:jobs},{data:profiles}]=await Promise.all([
    jobIds.length?admin.from("jobs").select("id,title,company_name,timezone").in("id",jobIds):Promise.resolve({data:[]}),
    vaIds.length?admin.from("profiles").select("id,full_name").in("id",vaIds):Promise.resolve({data:[]})
  ]);
  const jobMap=new Map(((jobs||[]) as JobSummaryRow[]).map((row)=>[row.id,row]));const nameMap=new Map(((profiles||[]) as {id:string;full_name:string|null}[]).map((row)=>[row.id,row.full_name?maskVaName(row.full_name):"VA candidate"]));
  const active=rows.filter((row)=>row.status!=="cancelled");
  return <>
    {query.requested?<div className="success-banner">Interview requested. Choose a time below to schedule it. The VA will use the Interviews workspace for this process.</div>:null}{query.scheduled?<div className="success-banner">Interview scheduled. The VA and client received confirmation.</div>:null}{query.cancelled?<div className="success-banner">Interview cancelled.</div>:null}{query.feedback_saved?<div className="success-banner">Interview feedback saved and the recruiting team was notified.</div>:null}
    <div className="page-head"><div><div className="kicker">Hiring interviews</div><h1>Candidate interviews</h1><p>Choose a time in your own timezone, join Google Meet, then record a simple Proceed, Hold, or Pass decision.</p></div><Link className="btn" href="/workspace/client/candidates">Back to candidates</Link></div>
    <div className="stack">
      {active.length?active.map((row)=>{const job:Partial<JobSummaryRow>=jobMap.get(row.job_id)||{};const candidate=String(nameMap.get(row.va_id)||"VA candidate");const canFeedback=Boolean(row.scheduled_at&&new Date(row.scheduled_at).getTime()<=Date.now());return <section className="card" key={row.id}>
        <div className="row-between wrap"><div><div className="row wrap"><span className="badge">{row.status}</span>{row.client_decision?<span className="badge badge-success">{row.client_decision}</span>:null}</div><h2 style={{margin:"8px 0 4px"}}>{candidate}</h2><p className="small muted">{job.title||"Client role"}{job.company_name?` · ${job.company_name}`:""}</p></div>{row.meeting_url&&row.status==="scheduled"?<a className="btn btn-primary" href={row.meeting_url} target="_blank" rel="noreferrer"><Video size={15}/> Join Google Meet <ExternalLink size={13}/></a>:null}</div>
        {row.status==="requested"?<div style={{marginTop:16}}><CandidateInterviewScheduler interviewId={row.id}/></div>:null}
        {row.status==="scheduled"?<div className="stack" style={{marginTop:16}}><div className="review-answer"><div className="row"><CalendarClock size={16}/><strong>{localLabel(row.scheduled_at,row.timezone)}</strong></div><p className="small muted">Timezone used when scheduled: {row.timezone||job.timezone||"Client local time"} · {row.duration_minutes||30} minutes</p></div><details><summary className="btn btn-sm">Reschedule</summary><div style={{marginTop:12}}><CandidateInterviewScheduler interviewId={row.id} currentIso={row.scheduled_at}/></div></details><form action={cancelCandidateInterviewAction}><input type="hidden" name="interview_id" value={row.id}/><input type="hidden" name="return_to" value="/workspace/client/interviews"/><button className="btn btn-sm" type="submit">Cancel interview</button></form></div>:null}
        {canFeedback&&!row.client_decision?<form action={submitCandidateInterviewFeedbackAction} className="stack" style={{marginTop:18}}><input type="hidden" name="interview_id" value={row.id}/><div><h3 style={{marginBottom:4}}>Interview decision</h3><p className="small muted">Keep this lightweight so the recruiting team can act immediately.</p></div><div className="field"><label>Decision</label><select name="decision" required defaultValue="hold"><option value="proceed">Proceed</option><option value="hold">Hold</option><option value="pass">Pass</option></select></div><div className="field"><label>Reason / theme</label><select name="feedback_reason" defaultValue=""><option value="">Choose if useful</option><option value="skills">Skills</option><option value="rate">Rate</option><option value="schedule / timezone">Schedule / timezone</option><option value="experience">Experience</option><option value="communication">Communication</option><option value="industry fit">Industry fit</option><option value="availability">Availability</option><option value="client preference">Client preference</option><option value="other">Other</option></select></div><div className="field"><label>Feedback for recruiter</label><textarea name="feedback" maxLength={3000} placeholder="What worked, what did not, or what you need clarified before deciding."/></div><button className="btn btn-primary" type="submit">Save interview decision</button></form>:null}
        {row.client_decision?<div className="review-answer" style={{marginTop:16}}><strong>Client decision: {row.client_decision}</strong>{row.client_feedback_reason?<p>Reason: {row.client_feedback_reason}</p>:null}{row.client_feedback?<p className="small muted">{row.client_feedback}</p>:null}</div>:null}
      </section>}):<div className="empty">No candidate interviews are waiting yet. Request an interview from your reviewed shortlist.</div>}
    </div>
  </>;
}
