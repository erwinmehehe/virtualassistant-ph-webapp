import Link from "next/link";
import { BadgeCheck, CalendarClock, CheckCircle2, HeartPulse, LifeBuoy, MessagesSquare, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { submitPlacementPulseAction } from "@/app/actions/agency-operations-v2";
import type { AvatarProfileRow, JobSummaryRow, PlacementCheckinRow, WorkroomRow } from "@/lib/workspace-rows";

const HEALTH_LABELS:Record<string,string>={building:"Building",healthy:"Healthy",watch:"Watch",at_risk:"At Risk"};
const STAGE_LABELS:Record<string,string>={pre_start:"Pre-start",launch:"Launch",active:"Active",recovery:"Recovery",replacement:"Replacement",ended:"Ended"};
function healthBadge(status:string){if(status==="healthy")return"badge-success";if(status==="watch"||status==="building")return"badge-warning";if(status==="at_risk")return"badge-danger";return"";}
function pulseLabel(value:string){return value.startsWith("day")?value.replace("day","Day "):value.startsWith("month")?value.replace("month","Month "):value;}
function dateLabel(value?:string|null){if(!value)return"Not scheduled";return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(new Date(value));}

export default async function ClientTeamPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const query=await searchParams;
  const {user}=await requireRole("client");
  const admin=createAdminClient();
  const {data:roomData,error}=await admin.from("workrooms").select("*").eq("client_id",user.id).order("created_at",{ascending:false});
  if(error)throw error;
  const active=((roomData||[]) as WorkroomRow[]).filter((r)=>r.placement_stage!=="ended"&&r.status!=="completed");
  const jobIds=[...new Set(active.map((r)=>r.job_id))];
  const vaIds=[...new Set(active.map((r)=>r.va_id).filter(Boolean))];
  const csmIds=[...new Set(active.map((r)=>r.client_success_owner_id).filter(Boolean))];
  const roomIds=active.map((r)=>r.id);
  const [{data:jobs},{data:vas},{data:vaSetups},{data:csms},{data:checkinData}]=await Promise.all([
    jobIds.length?admin.from("jobs").select("id,title,hours_per_week,timezone").in("id",jobIds):Promise.resolve({data:[]}),
    vaIds.length?admin.from("profiles").select("id,full_name,avatar_url").in("id",vaIds):Promise.resolve({data:[]}),
    vaIds.length?admin.from("va_profiles").select("user_id,work_setup_verified_at").in("user_id",vaIds):Promise.resolve({data:[]}),
    csmIds.length?admin.from("profiles").select("id,full_name").in("id",csmIds):Promise.resolve({data:[]}),
    roomIds.length?admin.from("placement_checkins").select("*").in("workroom_id",roomIds).order("due_at"):Promise.resolve({data:[]})
  ]);
  const jobMap=new Map(((jobs||[]) as JobSummaryRow[]).map((x)=>[x.id,x]));
  const vaMap=new Map(((vas||[]) as AvatarProfileRow[]).map((x)=>[x.id,x]));
  const setupMap=new Map(((vaSetups||[]) as {user_id:string;work_setup_verified_at:string|null}[]).map((x)=>[x.user_id,x]));
  const csmMap=new Map(((csms||[]) as AvatarProfileRow[]).map((x)=>[x.id,x]));
  const checkins=(checkinData||[]) as PlacementCheckinRow[];
  const requestedCheckin=String(query.checkin||"");

  return <>
    {query.pulse_saved?<div className="success-banner" role="status">Thanks. Your check-in was saved and Client Success will step in if anything needs attention.</div>:null}
    <div className="page-head"><div><h1>My Team</h1><p>Your active Virtual Assistants, placement health, launch progress, and Client Success support in one place.</p></div></div>
    {active.length?<div className="stack">{active.map((room)=>{const job:Partial<JobSummaryRow>=jobMap.get(room.job_id)||{};const va:Partial<AvatarProfileRow>=vaMap.get(room.va_id||"")||{};const setup:{work_setup_verified_at?:string|null}=setupMap.get(room.va_id||"")||{};const csm:Partial<AvatarProfileRow>=csmMap.get(room.client_success_owner_id||"")||{};const roomCheckins=checkins.filter((c)=>c.workroom_id===room.id);const pending=roomCheckins.filter((c)=>!c.client_signal&&c.status!=="skipped");const requested=roomCheckins.find((c)=>c.id===requestedCheckin&&!c.client_signal);const next=requested||pending[0];return <section className="card stack" key={room.id}>
      <div className="row-between wrap"><div className="row" style={{alignItems:"center"}}>{va.avatar_url?<img src={va.avatar_url} alt="" style={{width:48,height:48,borderRadius:"50%",objectFit:"cover"}}/>:null}<div><div className="row wrap"><h2 style={{margin:"0 0 3px"}}>{va.full_name||"Virtual Assistant"}</h2>{setup.work_setup_verified_at?<span className="badge badge-success"><BadgeCheck size={13}/>Work setup verified</span>:null}</div><p className="small muted" style={{margin:0}}>{job.title||"Placement"}</p></div></div><div className="row wrap"><span className={`badge ${healthBadge(room.health_status||"")}`}><HeartPulse size={13}/>{HEALTH_LABELS[room.health_status||""]||room.health_status}{room.health_score!=null?` · ${room.health_score}`:""}</span><span className="badge">{STAGE_LABELS[room.placement_stage||""]||room.placement_stage}</span></div></div>

      <div className="grid-4">
        <div><span className="small muted">Start date</span><strong style={{display:"block"}}>{room.start_date||"Not recorded"}</strong></div>
        <div><span className="small muted">Schedule</span><strong style={{display:"block"}}>{room.agreed_schedule||job.timezone||"Not recorded"}</strong></div>
        <div><span className="small muted">Client Success</span><strong style={{display:"block"}}>{csm.full_name||"Being assigned"}</strong></div>
        <div><span className="small muted">Readiness</span><strong style={{display:"block"}}>{room.placement_ready_at?"Placement Ready":"Setup in progress"}</strong></div>
      </div>

      {room.health_score==null?<div className="info-banner"><ShieldCheck size={16}/><div><strong>Health is still building</strong><p style={{margin:"4px 0 0"}}>We wait for enough real check-ins and operating data before showing a score.</p></div></div>:null}

      {next?<form action={submitPlacementPulseAction} className="card stack"><input type="hidden" name="checkin_id" value={next.id}/><div className="row-between wrap"><div><strong>{pulseLabel(next.checkpoint)} check-in</strong><p className="small muted" style={{margin:"4px 0 0"}}>How is {va.full_name||"your VA"} doing?</p></div><span className="small muted"><CalendarClock size={13}/> {dateLabel(next.due_at)}</span></div><div className="row wrap"><button className="btn btn-sm btn-primary" type="submit" name="signal" value="green">Great</button><button className="btn btn-sm" type="submit" name="signal" value="yellow">Some concerns</button><button className="btn btn-sm btn-danger" type="submit" name="signal" value="red">Need help</button></div><div className="field"><label>Optional note</label><textarea name="note" maxLength={2000} placeholder="Add context only if it helps Client Success understand what is going well or what needs attention."/></div></form>:<div className="info-banner"><CheckCircle2 size={16}/><span>No client check-in is waiting right now. We will ask again at the next placement milestone.</span></div>}

      <div className="row wrap"><Link className="btn btn-primary" href="/workspace/client/workroom"><MessagesSquare size={15}/> Open placement workroom</Link><Link className="btn" href="/workspace/client/support"><LifeBuoy size={15}/> Placement support</Link></div>
    </section>})}</div>:<div className="card empty"><h3>No active team members yet.</h3><p>My Team appears after a placement is confirmed. Until then, use Roles, Shortlist, Interviews, and Offers to complete the hire.</p><Link className="btn btn-primary" href="/workspace/client/jobs">View hiring roles</Link></div>}
  </>;
}
