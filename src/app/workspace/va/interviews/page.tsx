import Link from "next/link";
import { CalendarClock, ExternalLink, Video } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelCandidateInterviewAction } from "@/app/actions/recruiter-operations-system";

function localLabel(value?:string|null){if(!value)return"Not scheduled";return new Intl.DateTimeFormat("en",{dateStyle:"full",timeStyle:"short"}).format(new Date(value));}

export default async function VaInterviewsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const query=await searchParams;const {user}=await requireRole("va");const admin=createAdminClient();
  const {data:rows,error}=await admin.from("candidate_interviews").select("*").eq("va_id",user.id).order("created_at",{ascending:false}).limit(100);if(error)throw error;
  const jobIds=[...new Set((rows||[]).map((row:any)=>row.job_id))];const {data:jobs}=jobIds.length?await admin.from("jobs").select("id,title,company_name,timezone").in("id",jobIds):{data:[] as any[]};const jobMap=new Map((jobs||[]).map((row:any)=>[row.id,row]));
  const active=(rows||[]).filter((row:any)=>row.status!=="cancelled");
  return <>
    {query.cancelled?<div className="success-banner">Interview cancelled. The client has been notified.</div>:null}
    <div className="page-head"><div><div className="kicker">Client opportunities</div><h1>Interviews</h1><p>See upcoming client interviews, Zoom links, and scheduling details.</p></div><Link className="btn" href="/workspace/va/applications">Applications</Link></div>
    <div className="stack">{active.length?active.map((row:any)=>{const job:any=jobMap.get(row.job_id)||{};return <section className="card" key={row.id}><div className="row-between wrap"><div><div className="row wrap"><span className="badge">{row.status}</span>{row.client_decision?<span className="badge">Client: {row.client_decision}</span>:null}</div><h2 style={{margin:"8px 0 4px"}}>{job.title||"Client role"}</h2><p className="small muted">{job.company_name||"Client"}</p></div>{row.meeting_url&&row.status==="scheduled"?<a className="btn btn-primary" href={row.meeting_url} target="_blank" rel="noreferrer"><Video size={15}/> Join Zoom <ExternalLink size={13}/></a>:null}</div>{row.status==="requested"?<div className="alert" style={{marginTop:14}}>The client requested an interview and is choosing a time. You will be notified when it is scheduled.</div>:null}{row.status==="scheduled"?<div className="review-answer" style={{marginTop:14}}><div className="row"><CalendarClock size={16}/><strong>{localLabel(row.scheduled_at)}</strong></div><p className="small muted">Shown in your device timezone. Scheduled from {row.timezone||job.timezone||"client local time"} · {row.duration_minutes||30} minutes.</p><form action={cancelCandidateInterviewAction} style={{marginTop:10}}><input type="hidden" name="interview_id" value={row.id}/><input type="hidden" name="return_to" value="/workspace/va/interviews"/><button className="btn btn-sm" type="submit">I need to cancel</button></form></div>:null}{row.client_feedback?<div className="review-answer" style={{marginTop:14}}><strong>Client feedback recorded</strong><p className="small muted">Your recruiter will handle the next step with the client.</p></div>:null}</section>}):<div className="empty">No client interviews yet.</div>}</div>
  </>;
}
