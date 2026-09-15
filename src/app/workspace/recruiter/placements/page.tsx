import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, CircleDot, UsersRound } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const STAGE_LABELS: Record<string,string> = {
  onboarding:"Onboarding",healthy:"Healthy",watch:"Watch",at_risk:"At Risk",recovery:"Recovery",replacement:"Replacement",ended:"Ended"
};

function stageBadge(stage:string){
  if(stage==="healthy") return "badge-success";
  if(stage==="watch"||stage==="onboarding") return "badge-warning";
  if(["at_risk","recovery","replacement"].includes(stage)) return "badge-danger";
  return "";
}
function dueLabel(value:string){const diff=new Date(value).getTime()-Date.now();const hours=Math.round(Math.abs(diff)/3600000);if(diff<=0)return hours<24?`${hours}h overdue`:`${Math.round(hours/24)}d overdue`;return hours<24?`due in ${hours}h`:`due in ${Math.round(hours/24)}d`;}

export default async function RecruiterPlacementsPage(){
  const {userId}=await requireRoleFast("recruiter");
  const admin=createAdminClient();
  const {data:rooms,error}=await admin.from("workrooms").select("*").neq("placement_stage","ended").order("created_at",{ascending:false}).limit(250);
  if(error)throw error;
  const jobIds=[...new Set((rooms||[]).map((r:any)=>r.job_id))];
  const {data:jobs}=jobIds.length?await admin.from("jobs").select("id,title,company_name,recruiter_id,hiring_stage").in("id",jobIds):{data:[] as any[]};
  const jobMap=new Map((jobs||[]).map((j:any)=>[j.id,j]));
  const visible=(rooms||[]).filter((r:any)=>r.client_success_owner_id===userId||jobMap.get(r.job_id)?.recruiter_id===userId);
  const roomIds=visible.map((r:any)=>r.id);
  const profileIds=[...new Set(visible.flatMap((r:any)=>[r.client_id,r.va_id,r.client_success_owner_id]).filter(Boolean))];
  const [{data:profiles},{data:checkins}]=await Promise.all([
    profileIds.length?admin.from("profiles").select("id,full_name,role").in("id",profileIds):Promise.resolve({data:[] as any[]}),
    roomIds.length?admin.from("placement_checkins").select("*").in("workroom_id",roomIds).order("due_at") : Promise.resolve({data:[] as any[]})
  ]);
  const profileMap=new Map((profiles||[]).map((p:any)=>[p.id,p]));
  const now=Date.now();
  const active=visible.filter((r:any)=>r.placement_stage!=="ended");
  const risky=active.filter((r:any)=>["watch","at_risk","recovery","replacement"].includes(r.placement_stage));
  const handoffDue=active.filter((r:any)=>!r.handoff_completed_at);
  const startingSoon=active.filter((r:any)=>r.start_date&&new Date(`${r.start_date}T00:00:00Z`).getTime()>=now&&new Date(`${r.start_date}T00:00:00Z`).getTime()<=now+7*86400000);
  const due=(checkins||[]).filter((c:any)=>c.status==="todo"&&new Date(c.due_at).getTime()<=now+86400000);
  const attention=[...active].sort((a:any,b:any)=>{
    const rank=(r:any)=>["at_risk","recovery","replacement"].includes(r.placement_stage)?0:r.placement_stage==="watch"?1:!r.handoff_completed_at?2:3;
    return rank(a)-rank(b)||new Date(a.created_at).getTime()-new Date(b.created_at).getTime();
  });

  return <>
    <div className="page-head"><div><div className="kicker">Client Success</div><h1>Placements</h1><p>Run onboarding and retention by exception. Every placement has one Client Success owner, one health state, and one next action.</p></div></div>
    <div className="grid-4">
      <div className="card"><span className="small muted">Active seats</span><strong style={{display:"block",fontSize:28}}>{active.length}</strong></div>
      <div className="card"><span className="small muted">Needs attention</span><strong style={{display:"block",fontSize:28}}>{risky.length}</strong></div>
      <div className="card"><span className="small muted">Check-ins due</span><strong style={{display:"block",fontSize:28}}>{due.length}</strong></div>
      <div className="card"><span className="small muted">Handoffs incomplete</span><strong style={{display:"block",fontSize:28}}>{handoffDue.length}</strong></div>
    </div>

    {risky.length?<section className="card" style={{marginTop:18}}><div className="row-between wrap"><div><h2 style={{margin:0}}>Needs attention now</h2><p className="small muted" style={{margin:"5px 0 0"}}>Watch, At Risk, Recovery, and Replacement placements stay at the top until resolved.</p></div><AlertTriangle size={20}/></div><div className="stack" style={{marginTop:14}}>{risky.map((r:any)=>{const job:any=jobMap.get(r.job_id)||{};return <Link className="card" key={r.id} href={`/workspace/recruiter/placements/${r.id}`}><div className="row-between wrap"><div><span className={`badge ${stageBadge(r.placement_stage)}`}>{STAGE_LABELS[r.placement_stage]||r.placement_stage}</span><h3 style={{margin:"8px 0 3px"}}>{job.title||"Placement"}</h3><span className="small muted">{job.company_name||profileMap.get(r.client_id)?.full_name||"Client"} · {profileMap.get(r.va_id)?.full_name||"VA"}</span></div><strong>Act now →</strong></div>{r.at_risk_reason?<p className="small" style={{marginBottom:0}}>{r.at_risk_reason}</p>:null}</Link>})}</div></section>:null}

    <section className="card" style={{marginTop:18}}><div className="row-between wrap"><div><h2 style={{margin:0}}>Client Success queue</h2><p className="small muted" style={{margin:"5px 0 0"}}>Starting placements, readiness, health checks and retention work in one place.</p></div><UsersRound size={20}/></div>
      {attention.length?<div className="stack" style={{marginTop:14}}>{attention.map((r:any)=>{const job:any=jobMap.get(r.job_id)||{};const roomCheckins=(checkins||[]).filter((c:any)=>c.workroom_id===r.id&&c.status==="todo");const next=roomCheckins[0];const csm:any=profileMap.get(r.client_success_owner_id);return <Link className="card" href={`/workspace/recruiter/placements/${r.id}`} key={r.id}><div className="row-between wrap"><div><div className="row wrap"><span className={`badge ${stageBadge(r.placement_stage)}`}>{STAGE_LABELS[r.placement_stage]||r.placement_stage}</span>{r.placement_ready_at?<span className="badge badge-success"><CheckCircle2 size={12}/> Placement Ready</span>:<span className="badge"><CircleDot size={12}/> Setup incomplete</span>}</div><h3 style={{margin:"8px 0 3px"}}>{job.title||"Placement"}</h3><p className="small muted" style={{margin:0}}>{job.company_name||profileMap.get(r.client_id)?.full_name||"Client"} · {profileMap.get(r.va_id)?.full_name||"VA"}</p></div><div style={{textAlign:"right"}}><strong>{csm?.full_name||"CS owner needed"}</strong><div className="small muted">Client Success</div></div></div><div className="row wrap" style={{marginTop:12}}>{!r.handoff_completed_at?<span className="badge badge-warning">Handoff incomplete</span>:null}{next?<span className={`badge ${new Date(next.due_at).getTime()<=now?"badge-danger":""}`}><CalendarClock size={12}/> {String(next.checkpoint).replace("day","Day ")} {dueLabel(next.due_at)}</span>:<span className="small muted">No check-in currently due</span>}{r.start_date?<span className="small muted">Start {r.start_date}</span>:null}</div></Link>})}</div>:<div className="empty">No placements are assigned to you yet.</div>}
    </section>
    {startingSoon.length?<p className="small muted" style={{marginTop:12}}>{startingSoon.length} placement{startingSoon.length===1?"":"s"} starting in the next 7 days.</p>:null}
  </>;
}
