import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, CircleDot, UsersRound } from "lucide-react";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const STAGE_LABELS: Record<string,string> = { pre_start:"Pre-start",launch:"Launch",active:"Active",recovery:"Recovery",replacement:"Replacement",ended:"Ended" };
const HEALTH_LABELS: Record<string,string> = { building:"Building",healthy:"Healthy",watch:"Watch",at_risk:"At Risk" };

function healthBadge(status:string){if(status==="healthy")return"badge-success";if(status==="watch"||status==="building")return"badge-warning";if(status==="at_risk")return"badge-danger";return"";}
function stageBadge(stage:string){if(stage==="active")return"badge-success";if(stage==="pre_start"||stage==="launch")return"badge-warning";if(["recovery","replacement"].includes(stage))return"badge-danger";return"";}
function dueLabel(value:string){const diff=new Date(value).getTime()-Date.now();const hours=Math.round(Math.abs(diff)/3600000);if(diff<=0)return hours<24?`${hours}h overdue`:`${Math.round(hours/24)}d overdue`;return hours<24?`due in ${hours}h`:`due in ${Math.round(hours/24)}d`;}

export default async function ClientSuccessTodayPage(){
  const {user,profile}=await requireAnyRole(["admin","recruiter"]);
  const admin=createAdminClient();
  const {data:rooms,error}=await admin.from("workrooms").select("*").neq("placement_stage","ended").order("created_at",{ascending:false}).limit(300);
  if(error)throw error;
  const jobIds=[...new Set((rooms||[]).map((r:any)=>r.job_id))];
  const {data:jobs}=jobIds.length?await admin.from("jobs").select("id,title,company_name,recruiter_id,hiring_stage").in("id",jobIds):{data:[] as any[]};
  const jobMap=new Map((jobs||[]).map((j:any)=>[j.id,j]));
  const visible=profile.role==="admin"?(rooms||[]):(rooms||[]).filter((r:any)=>r.client_success_owner_id===user.id||jobMap.get(r.job_id)?.recruiter_id===user.id);
  const roomIds=visible.map((r:any)=>r.id);
  const profileIds=[...new Set(visible.flatMap((r:any)=>[r.client_id,r.va_id,r.client_success_owner_id]).filter(Boolean))];
  const [{data:profiles},{data:checkins}]=await Promise.all([
    profileIds.length?admin.from("profiles").select("id,full_name,role").in("id",profileIds):Promise.resolve({data:[] as any[]}),
    roomIds.length?admin.from("placement_checkins").select("id,workroom_id,checkpoint,due_at,status,client_signal,va_signal").in("workroom_id",roomIds).order("due_at"):Promise.resolve({data:[] as any[]})
  ]);
  const profileMap=new Map((profiles||[]).map((p:any)=>[p.id,p]));
  const now=Date.now();
  const active=visible.filter((r:any)=>r.placement_stage!=="ended");
  const healthy=active.filter((r:any)=>r.health_status==="healthy");
  const watch=active.filter((r:any)=>r.health_status==="watch");
  const atRisk=active.filter((r:any)=>r.health_status==="at_risk"||["recovery","replacement"].includes(r.placement_stage));
  const due=(checkins||[]).filter((c:any)=>c.status==="todo"&&new Date(c.due_at).getTime()<=now+86400000);
  const unowned=active.filter((r:any)=>!r.client_success_owner_id);
  const startingSoon=active.filter((r:any)=>r.start_date&&new Date(`${r.start_date}T00:00:00Z`).getTime()>=now&&new Date(`${r.start_date}T00:00:00Z`).getTime()<=now+7*86400000);

  const priority=[...active].sort((a:any,b:any)=>{
    const rank=(r:any)=>r.health_status==="at_risk"||["recovery","replacement"].includes(r.placement_stage)?0:r.health_status==="watch"?1:!r.client_success_owner_id?2:!r.handoff_completed_at?3:r.placement_stage==="pre_start"||r.placement_stage==="launch"?4:5;
    return rank(a)-rank(b)||new Date(a.created_at).getTime()-new Date(b.created_at).getTime();
  });

  return <>
    <div className="page-head"><div><div className="kicker">Client Success Today</div><h1>Who needs attention today?</h1><p>Healthy placements stay quiet. Concerns, launches, missed check-ins, and replacement work rise to the top.</p></div></div>

    <div className="grid-4">
      <div className="card"><span className="small muted">Active placements</span><strong style={{display:"block",fontSize:28}}>{active.length}</strong></div>
      <div className="card"><span className="small muted">Healthy</span><strong style={{display:"block",fontSize:28}}>{healthy.length}</strong></div>
      <div className="card"><span className="small muted">Watch</span><strong style={{display:"block",fontSize:28}}>{watch.length}</strong></div>
      <div className="card"><span className="small muted">At Risk</span><strong style={{display:"block",fontSize:28}}>{atRisk.length}</strong></div>
    </div>

    {(atRisk.length||due.length||unowned.length||startingSoon.length)?<section className="card" style={{marginTop:18}}><div className="row-between wrap"><div><h2 style={{margin:0}}>Priority work</h2><p className="small muted" style={{margin:"5px 0 0"}}>Exceptions only. Open the placement to see the latest signals and the next useful action.</p></div><AlertTriangle size={20}/></div><div className="row wrap" style={{marginTop:12}}>{atRisk.length?<span className="badge badge-danger">{atRisk.length} at risk / recovery</span>:null}{due.length?<span className="badge badge-warning">{due.length} check-ins due</span>:null}{unowned.length?<span className="badge">{unowned.length} need a CS owner</span>:null}{startingSoon.length?<span className="badge">{startingSoon.length} starting this week</span>:null}</div></section>:null}

    <section className="card" style={{marginTop:18}}><div className="row-between wrap"><div><h2 style={{margin:0}}>Placement queue</h2><p className="small muted" style={{margin:"5px 0 0"}}>Sorted by risk, ownership, handoff, and launch timing.</p></div><UsersRound size={20}/></div>
      {priority.length?<div className="stack" style={{marginTop:14}}>{priority.map((r:any)=>{const job:any=jobMap.get(r.job_id)||{};const roomCheckins=(checkins||[]).filter((c:any)=>c.workroom_id===r.id&&c.status==="todo");const next=roomCheckins[0];const csm:any=profileMap.get(r.client_success_owner_id);return <Link className="card" href={`/workspace/client-success/${r.id}`} key={r.id}><div className="row-between wrap"><div><div className="row wrap"><span className={`badge ${healthBadge(r.health_status)}`}>{HEALTH_LABELS[r.health_status]||r.health_status}{r.health_score!=null?` · ${r.health_score}`:""}</span><span className={`badge ${stageBadge(r.placement_stage)}`}>{STAGE_LABELS[r.placement_stage]||r.placement_stage}</span>{r.placement_ready_at?<span className="badge badge-success"><CheckCircle2 size={12}/> Placement Ready</span>:<span className="badge"><CircleDot size={12}/> Setup incomplete</span>}</div><h3 style={{margin:"8px 0 3px"}}>{job.title||"Placement"}</h3><p className="small muted" style={{margin:0}}>{job.company_name||profileMap.get(r.client_id)?.full_name||"Client"} · {profileMap.get(r.va_id)?.full_name||"VA"}</p></div><div style={{textAlign:"right"}}><strong>{csm?.full_name||"CS owner needed"}</strong><div className="small muted">Client Success</div></div></div><div className="row wrap" style={{marginTop:12}}>{!r.handoff_completed_at?<span className="badge badge-warning">Handoff incomplete</span>:null}{next?<span className={`badge ${new Date(next.due_at).getTime()<=now?"badge-danger":""}`}><CalendarClock size={12}/> {String(next.checkpoint).replace("day","Day ")} {dueLabel(next.due_at)}</span>:<span className="small muted">No check-in currently due</span>}{r.start_date?<span className="small muted">Start {r.start_date}</span>:null}</div>{r.at_risk_reason?<p className="small" style={{marginBottom:0}}>{r.at_risk_reason}</p>:null}</Link>})}</div>:<div className="empty">No active placements are assigned here yet.</div>}
    </section>
  </>;
}
