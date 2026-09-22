import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, CircleDot, HeartPulse, ShieldCheck, UsersRound } from "lucide-react";
import { DashHeader, Panel, Pill, StatCard } from "@/components/dash-ui";
import { requireAnyRoleFast } from "@/lib/auth";
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

function healthTone(status:string){
  if(status==="healthy") return "emerald" as const;
  if(status==="watch"||status==="building") return "amber" as const;
  if(status==="at_risk") return "rose" as const;
  return "slate" as const;
}

function healthBadge(status:string){
  if(status==="healthy")return"badge-success";
  if(status==="watch"||status==="building")return"badge-warning";
  if(status==="at_risk")return"badge-danger";
  return"";
}

function stageBadge(stage:string){
  if(stage==="active")return"badge-success";
  if(stage==="pre_start"||stage==="launch")return"badge-warning";
  if(["recovery","replacement"].includes(stage))return"badge-danger";
  return"";
}

function dueLabel(value:string){
  const diff=new Date(value).getTime()-Date.now();
  const hours=Math.round(Math.abs(diff)/3600000);
  if(diff<=0)return hours<24?`${hours}h overdue`:`${Math.round(hours/24)}d overdue`;
  return hours<24?`due in ${hours}h`:`due in ${Math.round(hours/24)}d`;
}

function placementClass(row:QueueRow){
  if(row.health_status==="at_risk"||["recovery","replacement"].includes(row.placement_stage))return"at-risk";
  if(row.health_status==="watch"||row.health_status==="building")return"watch";
  return"healthy";
}

export default async function ClientSuccessTodayPage(){
  const {userId}=await requireAnyRoleFast(["admin","recruiter"]);
  const admin=createAdminClient();
  const {data,error}=await admin.rpc("client_success_today_queue",{p_actor_id:userId,p_limit:200,p_offset:0});
  if(error)throw error;

  const now=Date.now();
  const active=(data||[]) as QueueRow[];
  const healthy=active.filter((r)=>r.health_status==="healthy");
  const watch=active.filter((r)=>r.health_status==="watch");
  const atRisk=active.filter((r)=>r.health_status==="at_risk"||["recovery","replacement"].includes(r.placement_stage));
  const dueCount=active.reduce((total,r)=>total+Number(r.due_checkins_24h||0),0);
  const unowned=active.filter((r)=>!r.client_success_owner_id);
  const startingSoon=active.filter((r)=>r.start_date&&new Date(`${r.start_date}T00:00:00Z`).getTime()>=now&&new Date(`${r.start_date}T00:00:00Z`).getTime()<=now+7*86400000);
  const priorityCount=atRisk.length+dueCount+unowned.length+startingSoon.length;

  return <div className="dash-page role-overview client-success-overview">
    <DashHeader
      kicker="Client Success Today"
      title="Who needs attention today?"
      subtitle="Healthy placements stay quiet. Launches, missed check-ins, ownership gaps, and at-risk accounts rise to the top."
    />

    <div className="dash-stats">
      <StatCard label="Active placements" value={active.length} icon={<UsersRound size={20}/>} tone="indigo" sub="All managed placements in your queue"/>
      <StatCard label="Healthy" value={healthy.length} icon={<ShieldCheck size={20}/>} tone="emerald" sub="No current intervention needed" chip={{label:healthy.length?"Stable":"None active",tone:"good"}}/>
      <StatCard label="Watch" value={watch.length} icon={<HeartPulse size={20}/>} tone="amber" sub="Monitor before risk increases" chip={watch.length?{label:"Needs watching",tone:"warn"}:{label:"Clear",tone:"good"}}/>
      <StatCard label="At risk" value={atRisk.length} icon={<AlertTriangle size={20}/>} tone="rose" sub="Recovery or replacement attention" chip={atRisk.length?{label:"Act now",tone:"warn"}:{label:"Clear",tone:"good"}}/>
    </div>

    {priorityCount?<Panel
      className="cs-priority-panel"
      title="Priority work"
      subtitle="Open the placement with the strongest current signal first."
    >
      <div className="cs-priority-signals">
        {atRisk.length?<Pill tone="rose">{atRisk.length} at risk / recovery</Pill>:null}
        {dueCount?<Pill tone="amber">{dueCount} check-ins due</Pill>:null}
        {unowned.length?<Pill tone="violet">{unowned.length} need an owner</Pill>:null}
        {startingSoon.length?<Pill tone="indigo">{startingSoon.length} starting this week</Pill>:null}
      </div>
    </Panel>:null}

    <Panel
      title="Placement queue"
      subtitle="Ordered by risk, ownership, handoff status, and launch timing. Healthy accounts stay visually quieter."
      action={<span className="small muted">{active.length} active</span>}
    >
      {active.length?<div className="cs-placement-list">
        {active.map((r)=>{
          const nextDue=r.next_due_at;
          const health=HEALTH_LABELS[r.health_status]||r.health_status;
          const stage=STAGE_LABELS[r.placement_stage]||r.placement_stage;
          return <Link prefetch={false} className="card" href={`/workspace/client-success/${r.workroom_id}`} key={r.workroom_id}>
            <div className={`cs-placement-row ${placementClass(r)}`}>
              <div className="cs-placement-main">
              <div className="cs-placement-tags">
                <span className={`badge ${healthBadge(r.health_status)}`}>{health}{r.health_score!=null?` · ${r.health_score}`:""}</span>
                <span className={`badge ${stageBadge(r.placement_stage)}`}>{stage}</span>
                {r.placement_ready_at
                  ? <span className="badge badge-success"><CheckCircle2 size={12}/> Placement ready</span>
                  : <span className="badge"><CircleDot size={12}/> Setup incomplete</span>}
              </div>
              <h3>{r.job_title||"Placement"}</h3>
              <p className="small muted">{r.company_name||r.client_name||"Client"} · {r.va_name||"VA"}</p>
            </div>

            <div className="cs-placement-owner">
              <span>Client Success owner</span>
              <strong>{r.client_success_owner_name||"Owner needed"}</strong>
            </div>

            <div className="cs-placement-meta">
              {!r.handoff_completed_at?<span className="badge badge-warning">Handoff incomplete</span>:null}
              {nextDue
                ? <span className={`badge ${new Date(nextDue).getTime()<=now?"badge-danger":""}`}><CalendarClock size={12}/> {String(r.next_checkpoint||"check-in").replace("day","Day ")} {dueLabel(nextDue)}</span>
                : <span className="small muted">No check-in currently due</span>}
              {r.start_date?<span className="small muted">Start {r.start_date}</span>:null}
              <Pill tone={healthTone(r.health_status)}>{health}</Pill>
            </div>

              {r.at_risk_reason?<p className="cs-placement-risk">{r.at_risk_reason}</p>:null}
            </div>
          </Link>;
        })}
      </div>:<div className="empty">No active placements are assigned here yet.</div>}
    </Panel>
  </div>;
}
