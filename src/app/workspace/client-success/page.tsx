import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, CircleDot, UsersRound } from "lucide-react";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const STAGE_LABELS: Record<string,string> = { pre_start:"Pre-start",launch:"Launch",active:"Active",recovery:"Recovery",replacement:"Replacement",ended:"Ended" };
const HEALTH_LABELS: Record<string,string> = { building:"Building",healthy:"Healthy",watch:"Watch",at_risk:"At Risk" };

type QueueRow = {
  workroom_id:string;
  job_title:string|null;
  company_name:string|null;
  client_name:string|null;
  va_name:string|null;
  client_success_owner_id:string|null;
  client_success_owner_name:string|null;
  placement_stage:string;
  handoff_completed_at:string|null;
  placement_ready_at:string|null;
  health_score:number|null;
  health_status:string;
  at_risk_reason:string|null;
  start_date:string|null;
  created_at:string;
  next_checkpoint:string|null;
  next_due_at:string|null;
  due_checkins_24h:number|string|null;
};

function healthBadge(status:string){if(status==="healthy")return"badge-success";if(status==="watch"||status==="building")return"badge-warning";if(status==="at_risk")return"badge-danger";return"";}
function stageBadge(stage:string){if(stage==="active")return"badge-success";if(stage==="pre_start"||stage==="launch")return"badge-warning";if(["recovery","replacement"].includes(stage))return"badge-danger";return"";}
function dueLabel(value:string){const diff=new Date(value).getTime()-Date.now();const hours=Math.round(Math.abs(diff)/3600000);if(diff<=0)return hours<24?`${hours}h overdue`:`${Math.round(hours/24)}d overdue`;return hours<24?`due in ${hours}h`:`due in ${Math.round(hours/24)}d`;}

export default async function ClientSuccessTodayPage(){
  const {user}=await requireAnyRole(["admin","recruiter"]);
  const admin=createAdminClient();
  const {data,error}=await admin.rpc("client_success_today_queue",{p_actor_id:user.id,p_limit:200,p_offset:0});
  if(error)throw error;

  const now=Date.now();
  const active=(data||[]) as QueueRow[];
  const healthy=active.filter((r)=>r.health_status==="healthy");
  const watch=active.filter((r)=>r.health_status==="watch");
  const atRisk=active.filter((r)=>r.health_status==="at_risk"||["recovery","replacement"].includes(r.placement_stage));
  const dueCount=active.reduce((total,r)=>total+Number(r.due_checkins_24h||0),0);
  const unowned=active.filter((r)=>!r.client_success_owner_id);
  const startingSoon=active.filter((r)=>r.start_date&&new Date(`${r.start_date}T00:00:00Z`).getTime()>=now&&new Date(`${r.start_date}T00:00:00Z`).getTime()<=now+7*86400000);

  return <>
    <div className="page-head"><div><div className="kicker">Client Success Today</div><h1>Who needs attention today?</h1><p>Healthy placements stay quiet. Concerns, launches, missed check-ins, and replacement work rise to the top.</p></div></div>

    <div className="grid-4">
      <div className="card"><span className="small muted">Active placements</span><strong style={{display:"block",fontSize:28}}>{active.length}</strong></div>
      <div className="card"><span className="small muted">Healthy</span><strong style={{display:"block",fontSize:28}}>{healthy.length}</strong></div>
      <div className="card"><span className="small muted">Watch</span><strong style={{display:"block",fontSize:28}}>{watch.length}</strong></div>
      <div className="card"><span className="small muted">At Risk</span><strong style={{display:"block",fontSize:28}}>{atRisk.length}</strong></div>
    </div>

    {(atRisk.length||dueCount||unowned.length||startingSoon.length)?<section className="card" style={{marginTop:18}}><div className="row-between wrap"><div><h2 style={{margin:0}}>Priority work</h2><p className="small muted" style={{margin:"5px 0 0"}}>Exceptions only. Open the placement to see the latest signals and the next useful action.</p></div><AlertTriangle size={20}/></div><div className="row wrap" style={{marginTop:12}}>{atRisk.length?<span className="badge badge-danger">{atRisk.length} at risk / recovery</span>:null}{dueCount?<span className="badge badge-warning">{dueCount} check-ins due</span>:null}{unowned.length?<span className="badge">{unowned.length} need a CS owner</span>:null}{startingSoon.length?<span className="badge">{startingSoon.length} starting this week</span>:null}</div></section>:null}

    <section className="card" style={{marginTop:18}}><div className="row-between wrap"><div><h2 style={{margin:0}}>Placement queue</h2><p className="small muted" style={{margin:"5px 0 0"}}>Sorted by risk, ownership, handoff, and launch timing.</p></div><UsersRound size={20}/></div>
      {active.length?<div className="stack" style={{marginTop:14}}>{active.map((r)=>{const nextDue=r.next_due_at;return <Link prefetch={false} className="card" href={`/workspace/client-success/${r.workroom_id}`} key={r.workroom_id}><div className="row-between wrap"><div><div className="row wrap"><span className={`badge ${healthBadge(r.health_status)}`}>{HEALTH_LABELS[r.health_status]||r.health_status}{r.health_score!=null?` · ${r.health_score}`:""}</span><span className={`badge ${stageBadge(r.placement_stage)}`}>{STAGE_LABELS[r.placement_stage]||r.placement_stage}</span>{r.placement_ready_at?<span className="badge badge-success"><CheckCircle2 size={12}/> Placement Ready</span>:<span className="badge"><CircleDot size={12}/> Setup incomplete</span>}</div><h3 style={{margin:"8px 0 3px"}}>{r.job_title||"Placement"}</h3><p className="small muted" style={{margin:0}}>{r.company_name||r.client_name||"Client"} · {r.va_name||"VA"}</p></div><div style={{textAlign:"right"}}><strong>{r.client_success_owner_name||"CS owner needed"}</strong><div className="small muted">Client Success</div></div></div><div className="row wrap" style={{marginTop:12}}>{!r.handoff_completed_at?<span className="badge badge-warning">Handoff incomplete</span>:null}{nextDue?<span className={`badge ${new Date(nextDue).getTime()<=now?"badge-danger":""}`}><CalendarClock size={12}/> {String(r.next_checkpoint||"check-in").replace("day","Day ")} {dueLabel(nextDue)}</span>:<span className="small muted">No check-in currently due</span>}{r.start_date?<span className="small muted">Start {r.start_date}</span>:null}</div>{r.at_risk_reason?<p className="small" style={{marginBottom:0}}>{r.at_risk_reason}</p>:null}</Link>})}</div>:<div className="empty">No active placements are assigned here yet.</div>}
    </section>
  </>;
}
