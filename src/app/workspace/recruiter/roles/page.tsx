import Link from "next/link";
import { BriefcaseBusiness, Clock3 } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { elapsedLabel } from "@/lib/format";
import { publicationBlocker } from "@/lib/job-publication";

type RoleListRow = { id: string; title: string | null; company_name: string | null; status: string; hiring_stage: string; hiring_stage_entered_at: string | null; target_start_date: string | null; recruiter_id: string | null; client_id: string | null; created_at: string; summary: string | null; responsibilities: string[] | null; required_skills: string[] | null; hours_per_week: number | null; timezone: string | null; min_hourly_rate: number | null; start_timing: string | null };
type JobStatusRef = { job_id: string; status: string };

const STAGES:Record<string,string>={intake:"Intake",ready_to_recruit:"Ready to Recruit",sourcing:"Sourcing",internal_review:"Internal Review",client_review:"Client Review",interviewing:"Interviewing",selected:"Selected",offer:"Offer",pre_start:"Pre-start",filled:"Filled",closed:"Closed"};
const SLA:Record<string,number>={intake:8,ready_to_recruit:2,sourcing:24,internal_review:24,client_review:48,interviewing:72,selected:2,offer:24,pre_start:72};
const age=(value?:string|null)=>elapsedLabel(value,{suffix:" in stage"});
function slaState(stage:string,entered?:string|null){const hours=SLA[stage];if(!hours||!entered)return null;const elapsed=(Date.now()-new Date(entered).getTime())/3600000;const left=hours-elapsed;return {late:left<0,label:left<0?`${Math.ceil(Math.abs(left))}h past target`:`${Math.ceil(left)}h to target`};}

export default async function RecruiterRolesPage(){
  const {userId}=await requireRoleFast("recruiter");
  const admin=createAdminClient();
  const {data:jobData,error}=await admin.from("jobs").select("id,title,company_name,status,hiring_stage,hiring_stage_entered_at,target_start_date,recruiter_id,client_id,created_at,summary,responsibilities,required_skills,hours_per_week,timezone,min_hourly_rate,start_timing").eq("recruiter_id",userId).order("updated_at",{ascending:false}).limit(250);
  if(error)throw error;
  const jobs=(jobData||[]) as RoleListRow[];
  const jobIds=jobs.map((j)=>j.id);
  const [{data:shortlistData},{data:interviewData},{data:offerData},{data:roomData},{data:commercialData}]=await Promise.all([
    jobIds.length?admin.from("job_shortlist_candidates").select("job_id,shortlist_status,client_decision").in("job_id",jobIds):Promise.resolve({data:[]}),
    jobIds.length?admin.from("candidate_interviews").select("job_id,status").in("job_id",jobIds):Promise.resolve({data:[]}),
    jobIds.length?admin.from("placement_offers").select("job_id,status").in("job_id",jobIds):Promise.resolve({data:[]}),
    jobIds.length?admin.from("workrooms").select("id,job_id,placement_stage").in("job_id",jobIds):Promise.resolve({data:[]}),
    jobIds.length?admin.from("job_commercials").select("job_id,commercial_status").in("job_id",jobIds):Promise.resolve({data:[]})
  ]);
  const shortlist=(shortlistData||[]) as {job_id:string;shortlist_status:string;client_decision:string|null}[];
  const interviews=(interviewData||[]) as JobStatusRef[];
  const offers=(offerData||[]) as JobStatusRef[];
  const rooms=(roomData||[]) as {id:string;job_id:string;placement_stage:string|null}[];
  const commercialMap=new Map(((commercialData||[]) as {job_id:string;commercial_status:string|null}[]).map((row)=>[row.job_id,row]));
  const open=jobs.filter((j)=>!["filled","closed"].includes(j.hiring_stage));
  const clientWaiting=open.filter((j)=>j.hiring_stage==="client_review").length;
  const interviewing=open.filter((j)=>j.hiring_stage==="interviewing").length;
  const recruiting=open.filter((j)=>["ready_to_recruit","sourcing","internal_review"].includes(j.hiring_stage)).length;

  return <>
    <div className="page-head"><div><div className="kicker">Recruitment operations</div><h1>Roles</h1><p>One hiring pipeline per role. Open the control center to see the brief, shortlist, interviews, offer, SLA and placement handoff together.</p></div></div>
    <div className="grid-4"><div className="card"><span className="small muted">Active roles</span><strong style={{display:"block",fontSize:28}}>{open.length}</strong></div><div className="card"><span className="small muted">Recruiting</span><strong style={{display:"block",fontSize:28}}>{recruiting}</strong></div><div className="card"><span className="small muted">Client review</span><strong style={{display:"block",fontSize:28}}>{clientWaiting}</strong></div><div className="card"><span className="small muted">Interviewing</span><strong style={{display:"block",fontSize:28}}>{interviewing}</strong></div></div>
    <section className="card" style={{marginTop:18}}><div className="row-between wrap"><div><h2 style={{margin:0}}>Hiring pipeline</h2><p className="small muted" style={{margin:"5px 0 0"}}>Old records no longer compete with live recruiting work. Filled and closed roles remain available as history.</p></div><BriefcaseBusiness size={20}/></div>
      {jobs.length?<div className="stack" style={{marginTop:14}}>{jobs.map((job)=>{const s=shortlist.filter((x)=>x.job_id===job.id);const i=interviews.filter((x)=>x.job_id===job.id);const o=offers.filter((x)=>x.job_id===job.id);const room=rooms.find((x)=>x.job_id===job.id);const sla=slaState(job.hiring_stage,job.hiring_stage_entered_at);const publication=publicationBlocker(job,commercialMap.get(job.id));return <Link href={`/workspace/recruiter/roles/${job.id}`} className="card" key={job.id}><div className="row-between wrap"><div><div className="row wrap"><span className="badge">{STAGES[job.hiring_stage]||job.hiring_stage}</span><span className={`badge ${publication.key==="published"?"badge-success":publication.key==="waiting_client_approval"?"badge-warning":""}`}>{publication.label}</span>{sla?<span className={`badge ${sla.late?"badge-danger":""}`}><Clock3 size={12}/>{sla.label}</span>:null}</div><h3 style={{margin:"8px 0 3px"}}>{job.title}</h3><p className="small muted" style={{margin:0}}>{job.company_name||"Client"} · {age(job.hiring_stage_entered_at)}</p></div><strong>Open control center →</strong></div><div className="row wrap" style={{marginTop:12}}><span className="small muted">{s.filter((x)=>x.shortlist_status==="proposed").length} internal</span><span className="small muted">{s.filter((x)=>x.shortlist_status==="released").length} client-visible</span><span className="small muted">{i.filter((x)=>x.status!=="cancelled").length} interviews</span><span className="small muted">{o.filter((x)=>!["declined","cancelled"].includes(x.status)).length} offers</span>{room?<span className="badge badge-success">Placement created</span>:null}</div></Link>})}</div>:<div className="empty">No roles are assigned to you.</div>}
    </section>
  </>;
}
