import Link from "next/link";
import { CalendarDays, CheckCircle2, ExternalLink, ListTodo, Mail, UserRound, Video } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { completeRecruiterTaskAction, snoozeRecruiterTaskAction } from "@/app/actions/recruiter-ops";

type AgendaTaskRow = { id: string; title: string; description: string | null; due_at: string; priority: string | null; href: string | null; repeat_rule: string | null; subject_type: string | null; subject_id: string | null };
type AgendaItem = {
  kind: "discovery" | "task" | "vetting_interview" | "client_interview";
  at: string;
  id: string;
  title: string;
  subtitle: string;
  bookedBy?: string | null;
  email?: string | null;
  timezone?: string;
  meetingUrl?: string | null;
  duration?: number;
  priority?: string | null;
  href?: string | null;
  vaId?: string;
  jobId?: string;
};

function timeLabel(value:string,zone:string){try{return new Intl.DateTimeFormat("en-PH",{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZone:zone}).format(new Date(value));}catch{return new Intl.DateTimeFormat("en-PH",{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZone:"Asia/Manila"}).format(new Date(value));}}
function ymdInManila(date:Date){return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Manila",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);}
function weekRange(){const ymd=ymdInManila(new Date());const [y,m,d]=ymd.split("-").map(Number);const weekday=new Date(Date.UTC(y,m-1,d)).getUTCDay();const mondayOffset=weekday===0?-6:1-weekday;const start=new Date(`${ymd}T00:00:00+08:00`);start.setUTCDate(start.getUTCDate()+mondayOffset);const end=new Date(start.getTime()+7*86400000);return{start,end};}
function taskHref(task:AgendaTaskRow){if(task.subject_type==="job"&&task.subject_id)return `/workspace/recruiter/matching/${task.subject_id}`;if(task.subject_type==="va"&&task.subject_id)return `/workspace/recruiter/candidates/${task.subject_id}`;return task.href||null;}

export default async function RecruiterAgendaPage(){
  const {userId}=await requireRoleFast("recruiter");
  const admin=createAdminClient();
  const {start,end}=weekRange();
  const startIso=start.toISOString(),endIso=end.toISOString();
  const {data:ownedJobs,error:jobsError}=await admin.from("jobs").select("id,title").eq("recruiter_id",userId).neq("status","closed");
  if(jobsError)throw jobsError;
  const ownedJobRows=(ownedJobs||[]) as {id:string;title:string|null}[];
  const ownedJobIds=ownedJobRows.map((job)=>job.id);
  const jobMap=new Map(ownedJobRows.map((job)=>[job.id,job.title]));

  const [{data:discoveries,error:discoveryError},{data:tasks,error:taskError},{data:vettingInterviews,error:vettingError},clientInterviewResult]=await Promise.all([
    admin.from("lead_intake").select("id,name,email,company,service,timezone,discovery_scheduled_at,discovery_duration_minutes,discovery_meeting_url,owner_id").not("discovery_scheduled_at","is",null).is("discovery_completed_at",null).is("discovery_cancelled_at",null).gte("discovery_scheduled_at",startIso).lt("discovery_scheduled_at",endIso).order("discovery_scheduled_at"),
    admin.from("recruiter_tasks").select("id,title,description,due_at,priority,href,repeat_rule,subject_type,subject_id").eq("assignee_id",userId).eq("status","todo").not("due_at","is",null).gte("due_at",startIso).lt("due_at",endIso).order("due_at"),
    admin.from("va_vetting").select("va_id,recruiter_interview_at,candidate:profiles!va_vetting_va_id_fkey(full_name)").eq("recruiter_id",userId).not("recruiter_interview_at","is",null).gte("recruiter_interview_at",startIso).lt("recruiter_interview_at",endIso).order("recruiter_interview_at"),
    ownedJobIds.length?admin.from("candidate_interviews").select("id,job_id,va_id,scheduled_at,timezone,duration_minutes,meeting_url,status,candidate:profiles!candidate_interviews_va_id_fkey(full_name)").in("job_id",ownedJobIds).eq("status","scheduled").not("scheduled_at","is",null).gte("scheduled_at",startIso).lt("scheduled_at",endIso).order("scheduled_at"):Promise.resolve({data:[],error:null})
  ]);
  if(discoveryError)throw discoveryError;if(taskError)throw taskError;if(vettingError)throw vettingError;if(clientInterviewResult.error)throw clientInterviewResult.error;
  const clientInterviews=(clientInterviewResult.data||[]) as {id:string;job_id:string;va_id:string;scheduled_at:string;timezone:string|null;duration_minutes:number|null;meeting_url:string|null;candidate:{full_name:string|null}|null}[];

  const items:AgendaItem[]=[
    ...((discoveries||[]) as {id:string;name:string|null;email:string|null;company:string|null;service:string|null;timezone:string|null;discovery_scheduled_at:string;discovery_duration_minutes:number|null;discovery_meeting_url:string|null}[]).map((lead)=>({kind:"discovery" as const,at:lead.discovery_scheduled_at,title:lead.company||lead.name||"Discovery call",bookedBy:lead.name||null,email:lead.email||null,subtitle:lead.service||"Client discovery",timezone:lead.timezone||"Asia/Manila",meetingUrl:lead.discovery_meeting_url,id:lead.id,duration:lead.discovery_duration_minutes||30})),
    ...((tasks||[]) as AgendaTaskRow[]).map((task)=>({kind:"task" as const,at:task.due_at,title:task.title,subtitle:task.description||"Recruiter task",priority:task.priority,href:taskHref(task),id:task.id})),
    ...((vettingInterviews||[]) as unknown as {va_id:string;recruiter_interview_at:string;candidate:{full_name:string|null}|null}[]).map((row)=>({kind:"vetting_interview" as const,at:row.recruiter_interview_at,title:row.candidate?.full_name||"VA candidate",subtitle:"Recruiter vetting interview",vaId:row.va_id,id:row.va_id})),
    ...clientInterviews.map((row)=>({kind:"client_interview" as const,at:row.scheduled_at,title:row.candidate?.full_name||"VA candidate",subtitle:jobMap.get(row.job_id)||"Client candidate interview",timezone:row.timezone||"Asia/Manila",meetingUrl:row.meeting_url,jobId:row.job_id,id:row.id,duration:row.duration_minutes||30}))
  ].sort((a,b)=>new Date(a.at).getTime()-new Date(b.at).getTime());

  const days=Array.from({length:7},(_,index)=>{const date=new Date(start.getTime()+index*86400000);return{key:ymdInManila(date),label:new Intl.DateTimeFormat("en-PH",{weekday:"long",month:"short",day:"numeric",timeZone:"Asia/Manila"}).format(date)};});

  return <div className="dash-page">
    <div className="dash-header"><div><div className="dash-kicker">Recruiter operations</div><h1>This Week</h1><p>All active discovery calls, plus your client candidate interviews, recruiter vetting interviews, and scheduled tasks in one agenda.</p></div><div className="row wrap"><Link className="btn" href="/workspace/recruiter/today"><ListTodo size={16}/> My Day</Link><Link className="btn" href="/workspace/recruiter/tasks">Tasks</Link></div></div>

    <div className="stack">
      {days.map((day)=>{const dayItems=items.filter((item)=>ymdInManila(new Date(item.at))===day.key);return <section className="card dashboard-section-card" key={day.key}>
        <div className="dashboard-section-head"><div><h2>{day.label}</h2><p>{dayItems.length?`${dayItems.length} scheduled item${dayItems.length===1?"":"s"}`:"No scheduled work"}</p></div><CalendarDays size={18}/></div>
        {dayItems.length?<div className="compact-list">{dayItems.map((item)=><div className="row-between wrap" key={`${item.kind}-${item.id}-${item.at}`} style={{padding:"12px 0",borderBottom:"1px solid var(--border)"}}>
          <div>
            <div className="row wrap"><strong>{item.title}</strong><span className="badge">{item.kind==="discovery"?"Discovery":item.kind==="client_interview"?"Client interview":item.kind==="vetting_interview"?"Vetting interview":"Task"}</span>{item.priority?<span className={`badge ${item.priority==="urgent"||item.priority==="high"?"badge-warning":""}`}>{item.priority}</span>:null}</div>
            <p className="small muted" style={{margin:"5px 0"}}>{item.subtitle}</p>
            {item.kind==="discovery"?<>
              <div className="row wrap small" style={{margin:"6px 0"}}><span><UserRound size={13}/> <strong>Booked by:</strong> {item.bookedBy||"Client"}</span>{item.email?<a href={`mailto:${item.email}`}><Mail size={13}/> {item.email}</a>:null}</div>
              <div className="small muted">Client: {timeLabel(item.at,item.timezone||"Asia/Manila")} ({item.timezone}) · Recruiter: {timeLabel(item.at,"Asia/Manila")} (Manila) · {item.duration} min</div>
            </>:item.kind==="client_interview"?<div className="small muted">Client/VA: {timeLabel(item.at,item.timezone||"Asia/Manila")} ({item.timezone}) · Recruiter: {timeLabel(item.at,"Asia/Manila")} (Manila) · {item.duration} min</div>:<div className="small muted">{timeLabel(item.at,"Asia/Manila")} · Manila</div>}
          </div>
          <div className="row wrap">
            {item.kind==="discovery"&&item.meetingUrl?<a className="btn btn-sm btn-primary" href={item.meetingUrl} target="_blank" rel="noreferrer"><Video size={13}/> Join Zoom <ExternalLink size={12}/></a>:null}
            {item.kind==="discovery"?<><Link className="btn btn-sm" href={`/workspace/recruiter/leads?view=discovery&q=${encodeURIComponent(item.email||item.bookedBy||item.title)}`}>View booking</Link><Link className="btn btn-sm" href={`/workspace/recruiter/leads?view=discovery&q=${encodeURIComponent(item.email||item.bookedBy||item.title)}`}>Complete discovery</Link></>:null}
            {item.kind==="client_interview"&&item.meetingUrl?<a className="btn btn-sm btn-primary" href={item.meetingUrl} target="_blank" rel="noreferrer"><Video size={13}/> Join interview <ExternalLink size={12}/></a>:null}
            {item.kind==="client_interview"?<Link className="btn btn-sm" href={`/workspace/recruiter/matching/${item.jobId}`}>Open interview</Link>:null}
            {item.kind==="vetting_interview"?<Link className="btn btn-sm" href={`/workspace/recruiter/candidates/${item.vaId}`}>View VA</Link>:null}
            {item.kind==="task"&&item.href?<Link className="btn btn-sm" href={item.href}>Act now</Link>:null}
            {item.kind==="task"?<><form action={snoozeRecruiterTaskAction}><input type="hidden" name="task_id" value={item.id}/><input type="hidden" name="minutes" value="1440"/><button className="btn btn-sm" type="submit">Snooze</button></form><form action={completeRecruiterTaskAction}><input type="hidden" name="task_id" value={item.id}/><input type="hidden" name="return_to" value="/workspace/recruiter/agenda"/><button className="btn btn-sm btn-primary" type="submit"><CheckCircle2 size={13}/> Done</button></form></>:null}
          </div>
        </div>)}</div>:<div className="small muted">Keep this space clear unless something genuinely needs a scheduled time.</div>}
      </section>})}
    </div>
  </div>;
}
