import Link from "next/link";
import { CalendarDays, CheckCircle2, ExternalLink, ListTodo, Mail, UserRound, Video } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { completeRecruiterTaskAction, snoozeRecruiterTaskAction } from "@/app/actions/recruiter-ops";

function timeLabel(value:string,zone:string){try{return new Intl.DateTimeFormat("en-PH",{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZone:zone}).format(new Date(value));}catch{return new Intl.DateTimeFormat("en-PH",{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZone:"Asia/Manila"}).format(new Date(value));}}
function ymdInManila(date:Date){return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Manila",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);}
function weekRange(){const ymd=ymdInManila(new Date());const [y,m,d]=ymd.split("-").map(Number);const weekday=new Date(Date.UTC(y,m-1,d)).getUTCDay();const mondayOffset=weekday===0?-6:1-weekday;const start=new Date(`${ymd}T00:00:00+08:00`);start.setUTCDate(start.getUTCDate()+mondayOffset);const end=new Date(start.getTime()+7*86400000);return{start,end};}

export default async function RecruiterAgendaPage(){
  const {userId}=await requireRoleFast("recruiter");
  const admin=createAdminClient();
  const {start,end}=weekRange();
  const startIso=start.toISOString(),endIso=end.toISOString();
  const [{data:discoveries,error:discoveryError},{data:tasks,error:taskError},{data:interviews,error:interviewError}]=await Promise.all([
    admin.from("lead_intake").select("id,name,email,company,service,timezone,discovery_scheduled_at,discovery_duration_minutes,discovery_meeting_url,owner_id").not("discovery_scheduled_at","is",null).is("discovery_completed_at",null).is("discovery_cancelled_at",null).gte("discovery_scheduled_at",startIso).lt("discovery_scheduled_at",endIso).or(`owner_id.eq.${userId},owner_id.is.null`).order("discovery_scheduled_at"),
    admin.from("recruiter_tasks").select("id,title,description,due_at,priority,href,repeat_rule").eq("assignee_id",userId).eq("status","todo").not("due_at","is",null).gte("due_at",startIso).lt("due_at",endIso).order("due_at"),
    admin.from("va_vetting").select("va_id,recruiter_interview_at,candidate:profiles!va_vetting_va_id_fkey(full_name)").eq("recruiter_id",userId).not("recruiter_interview_at","is",null).gte("recruiter_interview_at",startIso).lt("recruiter_interview_at",endIso).order("recruiter_interview_at")
  ]);
  if(discoveryError)throw discoveryError;if(taskError)throw taskError;if(interviewError)throw interviewError;

  const items:any[]=[
    ...(discoveries||[]).map((lead:any)=>({kind:"discovery",at:lead.discovery_scheduled_at,title:lead.company||lead.name||"Discovery call",bookedBy:lead.name||null,email:lead.email||null,company:lead.company||null,subtitle:lead.service||"Client discovery",timezone:lead.timezone||"Asia/Manila",meetingUrl:lead.discovery_meeting_url,id:lead.id,duration:lead.discovery_duration_minutes||30})),
    ...(tasks||[]).map((task:any)=>({kind:"task",at:task.due_at,title:task.title,subtitle:task.description||"Recruiter task",priority:task.priority,href:task.href,id:task.id,repeatRule:task.repeat_rule})),
    ...(interviews||[]).map((row:any)=>({kind:"interview",at:row.recruiter_interview_at,title:row.candidate?.full_name||"VA candidate",subtitle:"Recruiter interview",id:row.va_id}))
  ].sort((a,b)=>new Date(a.at).getTime()-new Date(b.at).getTime());

  const days=Array.from({length:7},(_,index)=>{const date=new Date(start.getTime()+index*86400000);return{key:ymdInManila(date),label:new Intl.DateTimeFormat("en-PH",{weekday:"long",month:"short",day:"numeric",timeZone:"Asia/Manila"}).format(date)};});

  return <div className="dash-page">
    <div className="dash-header"><div><div className="dash-kicker">Recruiter operations</div><h1>This Week</h1><p>Discovery calls, recruiter tasks, and VA interviews in one agenda.</p></div><div className="row wrap"><Link className="btn" href="/workspace/recruiter/today"><ListTodo size={16}/> My Day</Link><Link className="btn" href="/workspace/recruiter/tasks">Tasks</Link></div></div>

    <div className="stack">
      {days.map((day)=>{const dayItems=items.filter((item)=>ymdInManila(new Date(item.at))===day.key);return <section className="card dashboard-section-card" key={day.key}>
        <div className="dashboard-section-head"><div><h2>{day.label}</h2><p>{dayItems.length?`${dayItems.length} scheduled item${dayItems.length===1?"":"s"}`:"No scheduled work"}</p></div><CalendarDays size={18}/></div>
        {dayItems.length?<div className="compact-list">{dayItems.map((item:any)=><div className="row-between wrap" key={`${item.kind}-${item.id}-${item.at}`} style={{padding:"12px 0",borderBottom:"1px solid var(--border)"}}>
          <div>
            <div className="row wrap"><strong>{item.title}</strong><span className="badge">{item.kind==="discovery"?"Discovery":item.kind==="interview"?"VA interview":"Task"}</span>{item.priority?<span className={`badge ${item.priority==="urgent"||item.priority==="high"?"badge-warning":""}`}>{item.priority}</span>:null}</div>
            <p className="small muted" style={{margin:"5px 0"}}>{item.subtitle}</p>
            {item.kind==="discovery"?<>
              <div className="row wrap small" style={{margin:"6px 0"}}><span><UserRound size={13}/> <strong>Booked by:</strong> {item.bookedBy||"Client"}</span>{item.email?<a href={`mailto:${item.email}`}><Mail size={13}/> {item.email}</a>:null}</div>
              <div className="small muted">Client: {timeLabel(item.at,item.timezone)} ({item.timezone}) · Recruiter: {timeLabel(item.at,"Asia/Manila")} (Manila) · {item.duration} min</div>
            </>:<div className="small muted">{timeLabel(item.at,"Asia/Manila")} · Manila</div>}
          </div>
          <div className="row wrap">
            {item.kind==="discovery"&&item.meetingUrl?<a className="btn btn-sm btn-primary" href={item.meetingUrl} target="_blank" rel="noreferrer"><Video size={13}/> Join Zoom <ExternalLink size={12}/></a>:null}
            {item.kind==="discovery"?<><Link className="btn btn-sm" href={`/workspace/recruiter/leads?view=discovery&q=${encodeURIComponent(item.email||item.bookedBy||item.title)}`}>View booking</Link><Link className="btn btn-sm" href={`/workspace/recruiter/leads?view=discovery&q=${encodeURIComponent(item.email||item.bookedBy||item.title)}`}>Complete discovery</Link></>:null}
            {item.kind==="interview"?<Link className="btn btn-sm" href={`/workspace/recruiter/candidates/${item.id}`}>View VA</Link>:null}
            {item.kind==="task"&&item.href?<Link className="btn btn-sm" href={item.href}>Open</Link>:null}
            {item.kind==="task"?<><form action={snoozeRecruiterTaskAction}><input type="hidden" name="task_id" value={item.id}/><input type="hidden" name="minutes" value="1440"/><button className="btn btn-sm" type="submit">Snooze</button></form><form action={completeRecruiterTaskAction}><input type="hidden" name="task_id" value={item.id}/><input type="hidden" name="return_to" value="/workspace/recruiter/agenda"/><button className="btn btn-sm btn-primary" type="submit"><CheckCircle2 size={13}/> Done</button></form></>:null}
          </div>
        </div>)}</div>:<div className="small muted">Keep this space clear unless something genuinely needs a scheduled time.</div>}
      </section>})}
    </div>
  </div>;
}
