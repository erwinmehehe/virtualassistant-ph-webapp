import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, CircleDot, UserRoundCheck } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assignClientSuccessOwnerAction, completeRecruiterHandoffAction, recordPlacementCheckinAction, toggleAgencyChecklistAction, updatePlacementStageAction } from "@/app/actions/agency-operations-v2";

const STAGE_LABELS:Record<string,string>={onboarding:"Onboarding",healthy:"Healthy",watch:"Watch",at_risk:"At Risk",recovery:"Recovery",replacement:"Replacement",ended:"Ended"};
const SIGNAL_LABELS=[['','Not checked'],['green','🟢 Great / no issue'],['yellow','🟡 Some concern'],['red','🔴 Needs help']] as const;
function stageBadge(stage:string){if(stage==="healthy")return"badge-success";if(stage==="watch"||stage==="onboarding")return"badge-warning";if(["at_risk","recovery","replacement"].includes(stage))return"badge-danger";return"";}
function when(value?:string|null){if(!value)return"Not completed";return new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Manila"}).format(new Date(value));}
function checkpointLabel(value:string){return value.replace("day","Day ");}

export default async function PlacementControlCenter({params,searchParams}:{params:Promise<{id:string}>,searchParams:Promise<Record<string,string|undefined>>}){
  const [{id},query,{userId}]=await Promise.all([params,searchParams,requireRoleFast("recruiter")]);
  const admin=createAdminClient();
  const {data:room,error}=await admin.from("workrooms").select("*").eq("id",id).maybeSingle();
  if(error)throw error;if(!room)notFound();
  const [{data:job},{data:checklist},{data:checkins},{data:staff}]=await Promise.all([
    admin.from("jobs").select("*").eq("id",room.job_id).maybeSingle(),
    admin.from("workroom_checklist").select("*").eq("workroom_id",id).order("sort_order"),
    admin.from("placement_checkins").select("*").eq("workroom_id",id).order("due_at"),
    admin.from("profiles").select("id,full_name,role,account_status").in("role",["recruiter","admin"]).eq("account_status","active").order("full_name")
  ]);
  if(!job)notFound();
  if(job.recruiter_id!==userId&&room.client_success_owner_id!==userId)notFound();
  const ids=[job.client_id,room.va_id,job.recruiter_id,room.client_success_owner_id].filter(Boolean);
  const {data:people}=ids.length?await admin.from("profiles").select("id,full_name,role").in("id",ids):{data:[] as any[]};
  const names=new Map((people||[]).map((p:any)=>[p.id,p.full_name||p.role]));
  const clientItems=(checklist||[]).filter((x:any)=>x.owner_role==="client");
  const vaItems=(checklist||[]).filter((x:any)=>x.owner_role==="va");
  const agencyItems=(checklist||[]).filter((x:any)=>x.owner_role==="agency");
  const complete=(checklist||[]).filter((x:any)=>x.completed_at).length;
  const total=(checklist||[]).length;
  const returnTo=`/workspace/recruiter/placements/${id}`;

  return <>
    {query.csm_saved?<div className="success-banner">Client Success owner updated.</div>:null}
    {query.handoff_saved?<div className="success-banner">Recruiter handoff completed.</div>:null}
    {query.checkin_saved?<div className="success-banner">Placement check-in recorded.</div>:null}
    {query.stage_saved?<div className="success-banner">Placement status updated.</div>:null}
    <div className="page-head"><div><div className="kicker">Placement Control Center</div><h1>{job.title}</h1><p>{job.company_name||names.get(job.client_id)||"Client"} · {names.get(room.va_id)||"Virtual Assistant"}</p></div><div className="row wrap"><Link className="btn" href={`/workspace/recruiter/roles/${job.id}`}>Open hiring history</Link><Link className="btn" href="/workspace/recruiter/placements">All placements</Link></div></div>

    <div className="grid-4">
      <div className="card"><span className="small muted">Placement state</span><div style={{marginTop:8}}><span className={`badge ${stageBadge(room.placement_stage)}`}>{STAGE_LABELS[room.placement_stage]||room.placement_stage}</span></div></div>
      <div className="card"><span className="small muted">Readiness</span><strong style={{display:"block",marginTop:6}}>{room.placement_ready_at?"Placement Ready":"Setup incomplete"}</strong><span className="small muted">{complete}/{total} readiness items</span></div>
      <div className="card"><span className="small muted">Recruiter</span><strong style={{display:"block",marginTop:6}}>{names.get(job.recruiter_id)||"Unassigned"}</strong></div>
      <div className="card"><span className="small muted">Client Success</span><strong style={{display:"block",marginTop:6}}>{names.get(room.client_success_owner_id)||"Unassigned"}</strong></div>
    </div>

    <div className="grid-2" style={{marginTop:18}}>
      <section className="card"><div className="row-between wrap"><div><h2 style={{margin:0}}>Recruiter → Client Success handoff</h2><p className="small muted" style={{margin:"5px 0 0"}}>Recruiting does not end until an owner and useful handoff are recorded.</p></div><UserRoundCheck size={20}/></div>
        <form action={assignClientSuccessOwnerAction} className="row wrap" style={{marginTop:14}}><input type="hidden" name="workroom_id" value={id}/><input type="hidden" name="return_to" value={returnTo}/><div className="field" style={{flex:1,minWidth:220}}><label>Client Success owner</label><select name="client_success_owner_id" defaultValue={room.client_success_owner_id||""} required><option value="">Choose owner</option>{(staff||[]).map((p:any)=><option value={p.id} key={p.id}>{p.full_name||p.role}</option>)}</select></div><button className="btn btn-primary" type="submit" style={{alignSelf:"end"}}>Assign owner</button></form>
        {room.handoff_completed_at?<div className="info-banner" style={{marginTop:14}}><strong>Handoff completed</strong><p style={{margin:"5px 0"}}>{room.handoff_notes}</p><span className="small muted">{when(room.handoff_completed_at)}</span></div>:<form action={completeRecruiterHandoffAction} className="stack" style={{marginTop:14}}><input type="hidden" name="workroom_id" value={id}/><input type="hidden" name="return_to" value={returnTo}/><div className="field"><label>Handoff notes</label><textarea name="handoff_notes" minLength={20} maxLength={4000} required placeholder="What was promised, client priorities, risks, communication preferences, backup candidate context, and anything Client Success must know before Day 1."/></div><button className="btn btn-primary" type="submit">Complete formal handoff</button></form>}
      </section>

      <section className="card"><h2 style={{marginTop:0}}>Placement status</h2><p className="small muted">Use simple operational states. No artificial health percentage.</p><form action={updatePlacementStageAction} className="stack"><input type="hidden" name="workroom_id" value={id}/><input type="hidden" name="return_to" value={returnTo}/><div className="field"><label>Status</label><select name="placement_stage" defaultValue={room.placement_stage}>{Object.entries(STAGE_LABELS).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></div><div className="field"><label>Reason / risk context</label><textarea name="at_risk_reason" maxLength={2000} defaultValue={room.at_risk_reason||""} placeholder="Required for At Risk, Recovery, Replacement, or Ended."/></div><div className="field"><label>Recovery plan</label><textarea name="recovery_plan" maxLength={4000} defaultValue={room.recovery_plan||""} placeholder="Required when moving to Recovery. Keep it concrete and time-bound."/></div><button className="btn" type="submit">Save placement status</button></form></section>
    </div>

    <section className="card" style={{marginTop:18}}><div className="row-between wrap"><div><h2 style={{margin:0}}>Placement readiness</h2><p className="small muted" style={{margin:"5px 0 0"}}>Placement Ready requires every client, VA and agency item plus the formal handoff.</p></div>{room.placement_ready_at?<span className="badge badge-success"><CheckCircle2 size={13}/> Placement Ready</span>:<span className="badge badge-warning"><CircleDot size={13}/> {complete}/{total} complete</span>}</div>
      <div className="grid-3" style={{marginTop:14}}>
        <div><h3>Client</h3><div className="stack">{clientItems.map((x:any)=><div className="row-between" key={x.id}><span className="small">{x.title}</span><span className={`badge ${x.completed_at?"badge-success":""}`}>{x.completed_at?"Done":"Waiting"}</span></div>)}</div></div>
        <div><h3>VA</h3><div className="stack">{vaItems.map((x:any)=><div className="row-between" key={x.id}><span className="small">{x.title}</span><span className={`badge ${x.completed_at?"badge-success":""}`}>{x.completed_at?"Done":"Waiting"}</span></div>)}</div></div>
        <div><h3>Agency</h3><div className="stack">{agencyItems.map((x:any)=><form action={toggleAgencyChecklistAction} className="row-between" key={x.id}><input type="hidden" name="checklist_id" value={x.id}/><input type="hidden" name="workroom_id" value={id}/><input type="hidden" name="return_to" value={returnTo}/><input type="hidden" name="done" value={x.completed_at?"1":"0"}/><span className="small">{x.title}</span><button className={`btn btn-sm ${x.completed_at?"":"btn-primary"}`} type="submit">{x.completed_at?"Reopen":"Complete"}</button></form>)}</div></div>
      </div>
    </section>

    <section className="card" style={{marginTop:18}}><div className="row-between wrap"><div><h2 style={{margin:0}}>Placement health check-ins</h2><p className="small muted" style={{margin:"5px 0 0"}}>Day 3, 7, 14 and 30. Record signals, then work only the exceptions.</p></div></div><div className="stack" style={{marginTop:14}}>{(checkins||[]).map((c:any)=><div className="card" key={c.id}><div className="row-between wrap"><div><strong>{checkpointLabel(c.checkpoint)}</strong><div className="small muted">Due {when(c.due_at)}</div></div><span className={`badge ${c.status==="completed"?"badge-success":new Date(c.due_at).getTime()<Date.now()?"badge-danger":""}`}>{c.status==="completed"?"Completed":new Date(c.due_at).getTime()<Date.now()?"Overdue":"Upcoming"}</span></div>{c.status==="completed"?<div className="grid-3" style={{marginTop:12}}><div><span className="small muted">Client</span><strong style={{display:"block"}}>{c.client_signal||"Not recorded"}</strong></div><div><span className="small muted">VA</span><strong style={{display:"block"}}>{c.va_signal||"Not recorded"}</strong></div><div><span className="small muted">Notes</span><strong style={{display:"block"}}>{c.notes||"No issue noted"}</strong></div></div>:<form action={recordPlacementCheckinAction} className="stack" style={{marginTop:12}}><input type="hidden" name="checkin_id" value={c.id}/><input type="hidden" name="workroom_id" value={id}/><input type="hidden" name="return_to" value={returnTo}/><div className="grid-2"><div className="field"><label>Client signal</label><select name="client_signal" defaultValue="">{SIGNAL_LABELS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div><div className="field"><label>VA signal</label><select name="va_signal" defaultValue="">{SIGNAL_LABELS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div></div><div className="field"><label>Notes</label><textarea name="notes" maxLength={4000} placeholder="Only what the next operator needs to know. Record concerns and agreed next steps."/></div><button className="btn btn-primary" type="submit">Complete check-in</button></form>}</div>)}</div></section>

    {["at_risk","recovery","replacement"].includes(room.placement_stage)?<div className="alert" style={{marginTop:18}}><AlertTriangle size={18}/><div><strong>This placement needs active Client Success ownership.</strong><p style={{margin:"4px 0 0"}}>Do not let it sit in messages. Keep the reason, recovery plan and next decision here until it returns to Healthy or moves to Replacement.</p></div></div>:null}
  </>;
}
