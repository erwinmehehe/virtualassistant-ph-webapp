import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, CircleDot, HeartPulse, UserRoundCheck } from "lucide-react";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlacementCheckinRow, StaffProfileRow, WorkroomChecklistRow } from "@/lib/workspace-rows";
import { assignClientSuccessOwnerAction, completeRecruiterHandoffAction, recordPlacementCheckinAction, toggleAgencyChecklistAction, updatePlacementStageAction } from "@/app/actions/agency-operations-v2";

const STAGE_LABELS:Record<string,string>={pre_start:"Pre-start",launch:"Launch",active:"Active",recovery:"Recovery",replacement:"Replacement",ended:"Ended"};
const HEALTH_LABELS:Record<string,string>={building:"Building",healthy:"Healthy",watch:"Watch",at_risk:"At Risk"};
const SIGNAL_LABELS=[['','Not checked'],['green','Great'],['yellow','Some concerns'],['red','Need help']] as const;
function healthBadge(status:string){if(status==="healthy")return"badge-success";if(status==="watch"||status==="building")return"badge-warning";if(status==="at_risk")return"badge-danger";return"";}
function stageBadge(stage:string){if(stage==="active")return"badge-success";if(stage==="pre_start"||stage==="launch")return"badge-warning";if(["recovery","replacement"].includes(stage))return"badge-danger";return"";}
function when(value?:string|null){if(!value)return"Not completed";return new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Manila"}).format(new Date(value));}
function checkpointLabel(value:string){if(value.startsWith("day"))return value.replace("day","Day ");if(value.startsWith("month"))return value.replace("month","Month ");return value;}
function signalLabel(value?:string|null){return value==="green"?"Great":value==="yellow"?"Some concerns":value==="red"?"Need help":"Not recorded";}

export default async function PlacementControlCenter({params,searchParams}:{params:Promise<{id:string}>,searchParams:Promise<Record<string,string|undefined>>}){
  const [{id},query,{user,profile}]=await Promise.all([params,searchParams,requireAnyRole(["admin","recruiter"])]);
  const admin=createAdminClient();
  const {data:room,error}=await admin.from("workrooms").select("*").eq("id",id).maybeSingle();
  if(error)throw error;if(!room)notFound();
  const [{data:job},{data:checklistData},{data:checkinData},{data:staffData}]=await Promise.all([
    admin.from("jobs").select("*").eq("id",room.job_id).maybeSingle(),
    admin.from("workroom_checklist").select("*").eq("workroom_id",id).order("sort_order"),
    admin.from("placement_checkins").select("*").eq("workroom_id",id).order("due_at"),
    admin.from("profiles").select("id,full_name,role,account_status").in("role",["recruiter","admin"]).eq("account_status","active").order("full_name")
  ]);
  if(!job)notFound();
  const checklist=(checklistData||[]) as WorkroomChecklistRow[];
  const checkins=(checkinData||[]) as PlacementCheckinRow[];
  const staff=(staffData||[]) as StaffProfileRow[];
  if(profile.role!=="admin"&&job.recruiter_id!==user.id&&room.client_success_owner_id!==user.id)notFound();
  const ids=[job.client_id,room.va_id,job.recruiter_id,room.client_success_owner_id].filter(Boolean);
  const {data:people}=ids.length?await admin.from("profiles").select("id,full_name,role").in("id",ids):{data:[]};
  const names=new Map(((people||[]) as StaffProfileRow[]).map((p)=>[p.id,p.full_name||p.role]));
  const clientItems=checklist.filter((x)=>x.owner_role==="client");
  const vaItems=checklist.filter((x)=>x.owner_role==="va");
  const agencyItems=checklist.filter((x)=>x.owner_role==="agency");
  const complete=checklist.filter((x)=>x.completed_at).length;
  const total=(checklist||[]).length;
  const returnTo=`/workspace/client-success/${id}`;
  const pendingCheckins=checkins.filter((c)=>c.status!=="completed"&&c.status!=="skipped");
  const nextCheckin=pendingCheckins[0];

  return <>
    {query.csm_saved?<div className="success-banner">Client Success owner updated.</div>:null}
    {query.handoff_saved?<div className="success-banner">Recruiter handoff completed.</div>:null}
    {query.checkin_saved?<div className="success-banner">Placement check-in recorded.</div>:null}
    {query.stage_saved?<div className="success-banner">Placement stage updated.</div>:null}
    <div className="page-head"><div><div className="kicker">Managed placement</div><h1>{job.title}</h1><p>{job.company_name||names.get(job.client_id)||"Client"} · {names.get(room.va_id)||"Virtual Assistant"}</p></div><div className="row wrap"><Link className="btn" href={`/workspace/recruiter/roles/${job.id}`}>Hiring history</Link><Link className="btn" href="/workspace/client-success">Client Success Today</Link></div></div>

    <div className="grid-4">
      <div className="card"><span className="small muted">Placement health</span><div style={{marginTop:8}}><span className={`badge ${healthBadge(room.health_status)}`}>{HEALTH_LABELS[room.health_status]||room.health_status}{room.health_score!=null?` · ${room.health_score}/100`:""}</span></div><span className="small muted" style={{display:"block",marginTop:6}}>{room.health_score==null?`Waiting for enough real signals · ${room.health_coverage||0}% evidence coverage`:`Calculated from structured placement signals · ${room.health_coverage||0}% evidence coverage`}</span></div>
      <div className="card"><span className="small muted">Lifecycle</span><div style={{marginTop:8}}><span className={`badge ${stageBadge(room.placement_stage)}`}>{STAGE_LABELS[room.placement_stage]||room.placement_stage}</span></div></div>
      <div className="card"><span className="small muted">Readiness</span><strong style={{display:"block",marginTop:6}}>{room.placement_ready_at?"Placement Ready":"Setup incomplete"}</strong><span className="small muted">{complete}/{total} readiness items</span></div>
      <div className="card"><span className="small muted">Next check-in</span><strong style={{display:"block",marginTop:6}}>{nextCheckin?checkpointLabel(nextCheckin.checkpoint):"Monthly monitoring"}</strong><span className="small muted">{nextCheckin?when(nextCheckin.due_at):"No check-in waiting"}</span></div>
    </div>

    <div className="grid-2" style={{marginTop:18}}>
      <section className="card"><div className="row-between wrap"><div><h2 style={{margin:0}}>Recruiter → Client Success handoff</h2><p className="small muted" style={{margin:"5px 0 0"}}>The placement belongs to Client Success only after ownership and the recruiting context are clear.</p></div><UserRoundCheck size={20}/></div>
        <form action={assignClientSuccessOwnerAction} className="row wrap" style={{marginTop:14}}><input type="hidden" name="workroom_id" value={id}/><input type="hidden" name="return_to" value={returnTo}/><div className="field" style={{flex:1,minWidth:220}}><label>Client Success owner</label><select name="client_success_owner_id" defaultValue={room.client_success_owner_id||""} required><option value="">Choose owner</option>{staff.map((p)=><option value={p.id} key={p.id}>{p.full_name||p.role}</option>)}</select></div><button className="btn btn-primary" type="submit" style={{alignSelf:"end"}}>Assign owner</button></form>
        {room.handoff_completed_at?<div className="info-banner" style={{marginTop:14}}><strong>Handoff completed</strong><p style={{margin:"5px 0"}}>{room.handoff_notes}</p><span className="small muted">{when(room.handoff_completed_at)}</span></div>:<form action={completeRecruiterHandoffAction} className="stack" style={{marginTop:14}}><input type="hidden" name="workroom_id" value={id}/><input type="hidden" name="return_to" value={returnTo}/><div className="field"><label>Handoff notes</label><textarea name="handoff_notes" minLength={20} maxLength={4000} required placeholder="Why this VA was selected, strengths, risks, client expectations, schedule, start goals, onboarding concerns, and backup candidate context."/></div><button className="btn btn-primary" type="submit">Complete formal handoff</button></form>}
      </section>

      <section className="card"><div className="row-between wrap"><div><h2 style={{margin:0}}>Placement lifecycle</h2><p className="small muted" style={{margin:"5px 0 0"}}>Lifecycle is separate from health. Use Recovery or Replacement only after a real issue is being managed.</p></div><HeartPulse size={20}/></div><form action={updatePlacementStageAction} className="stack" style={{marginTop:14}}><input type="hidden" name="workroom_id" value={id}/><input type="hidden" name="return_to" value={returnTo}/><div className="field"><label>Stage</label><select name="placement_stage" defaultValue={room.placement_stage}>{Object.entries(STAGE_LABELS).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></div><div className="field"><label>Issue / decision context</label><textarea name="at_risk_reason" maxLength={2000} defaultValue={room.at_risk_reason||""} placeholder="Required for Recovery, Replacement, or Ended."/></div><div className="field"><label>Recovery plan</label><textarea name="recovery_plan" maxLength={4000} defaultValue={room.recovery_plan||""} placeholder="If Recovery is selected, define the issue, expected standard, client action, VA action, Client Success action, success measure, and review date."/></div><button className="btn" type="submit">Save placement stage</button></form></section>
    </div>

    <section className="card" style={{marginTop:18}}><div className="row-between wrap"><div><h2 style={{margin:0}}>Placement readiness</h2><p className="small muted" style={{margin:"5px 0 0"}}>Placement Ready requires the client, VA, agency, and formal handoff to be ready for launch.</p></div>{room.placement_ready_at?<span className="badge badge-success"><CheckCircle2 size={13}/> Placement Ready</span>:<span className="badge badge-warning"><CircleDot size={13}/> {complete}/{total} complete</span>}</div>
      <div className="grid-3" style={{marginTop:14}}>
        <div><h3>Client</h3><div className="stack">{clientItems.map((x)=><div className="row-between" key={x.id}><span className="small">{x.title}</span><span className={`badge ${x.completed_at?"badge-success":""}`}>{x.completed_at?"Done":"Waiting"}</span></div>)}</div></div>
        <div><h3>VA</h3><div className="stack">{vaItems.map((x)=><div className="row-between" key={x.id}><span className="small">{x.title}</span><span className={`badge ${x.completed_at?"badge-success":""}`}>{x.completed_at?"Done":"Waiting"}</span></div>)}</div></div>
        <div><h3>Agency</h3><div className="stack">{agencyItems.map((x)=><form action={toggleAgencyChecklistAction} className="row-between" key={x.id}><input type="hidden" name="checklist_id" value={x.id}/><input type="hidden" name="workroom_id" value={id}/><input type="hidden" name="return_to" value={returnTo}/><input type="hidden" name="done" value={x.completed_at?"1":"0"}/><span className="small">{x.title}</span><button className={`btn btn-sm ${x.completed_at?"":"btn-primary"}`} type="submit">{x.completed_at?"Reopen":"Complete"}</button></form>)}</div></div>
      </div>
    </section>

    <section className="card" style={{marginTop:18}}><div className="row-between wrap"><div><h2 style={{margin:0}}>Placement check-ins</h2><p className="small muted" style={{margin:"5px 0 0"}}>Client and VA pulses are requested automatically. Healthy responses close quietly; concerns come here for review.</p></div></div><div className="stack" style={{marginTop:14}}>{checkins.map((c)=><div className="card" key={c.id}><div className="row-between wrap"><div><strong>{checkpointLabel(c.checkpoint)}</strong><div className="small muted">Due {when(c.due_at)}</div></div><span className={`badge ${c.status==="completed"?"badge-success":new Date(c.due_at).getTime()<Date.now()?"badge-danger":""}`}>{c.status==="completed"?"Completed":new Date(c.due_at).getTime()<Date.now()?"Overdue":"Upcoming"}</span></div><div className="grid-2" style={{marginTop:12}}><div><span className="small muted">Client</span><strong style={{display:"block"}}>{signalLabel(c.client_signal)}</strong>{c.client_note?<p className="small" style={{margin:"5px 0 0"}}>{c.client_note}</p>:null}</div><div><span className="small muted">VA</span><strong style={{display:"block"}}>{signalLabel(c.va_signal)}</strong>{c.va_note?<p className="small" style={{margin:"5px 0 0"}}>{c.va_note}</p>:null}</div></div>{c.status!=="completed"?<details style={{marginTop:12}}><summary className="btn btn-sm">Record a check-in from a call</summary><form action={recordPlacementCheckinAction} className="stack" style={{marginTop:12}}><input type="hidden" name="checkin_id" value={c.id}/><input type="hidden" name="workroom_id" value={id}/><input type="hidden" name="return_to" value={returnTo}/><div className="grid-2"><div className="field"><label>Client signal</label><select name="client_signal" defaultValue={c.client_signal||""}>{SIGNAL_LABELS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div><div className="field"><label>VA signal</label><select name="va_signal" defaultValue={c.va_signal||""}>{SIGNAL_LABELS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div></div><div className="field"><label>Notes</label><textarea name="notes" maxLength={4000} placeholder="What changed, what was agreed, and what should happen next?"/></div><button className="btn btn-primary" type="submit">Save check-in</button></form></details>:null}</div>)}</div></section>

    {(room.health_status==="at_risk"||["recovery","replacement"].includes(room.placement_stage))?<div className="alert" style={{marginTop:18}}><AlertTriangle size={18}/><div><strong>This placement needs active Client Success ownership.</strong><p style={{margin:"4px 0 0"}}>Keep the issue, agreed recovery plan, and next decision here instead of letting it disappear into messages.</p></div></div>:null}
  </>;
}
