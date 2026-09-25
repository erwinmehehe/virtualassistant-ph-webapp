import { CalendarClock, CheckCircle2, LifeBuoy } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { JobSummaryRow, PlacementSupportRequestRow } from "@/lib/workspace-rows";

type VaSupportRoomRow = { id: string; job_id: string; client_id: string | null; placement_stage: string | null; agreed_schedule: string | null; start_date: string | null };
import { submitPlacementSupportRequestAction } from "@/app/actions/placement-support";

const TYPE_LABELS: Record<string,string> = { leave:"Leave", sick:"Sick leave", emergency:"Emergency", late:"Late / delayed", schedule_change:"Schedule change", concern:"Placement concern" };
const STATUS_LABELS: Record<string,string> = { open:"Open", acknowledged:"Acknowledged", resolved:"Resolved", declined:"Declined" };
function badge(status:string){return status==="resolved"?"badge-success":status==="declined"?"badge-danger":status==="acknowledged"?"badge-warning":"";}

export default async function VaSupportPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const query=await searchParams;
  const {user}=await requireRole("va");
  const admin=createAdminClient();
  const {data:roomData,error}=await admin.from("workrooms").select("id,job_id,client_id,placement_stage,agreed_schedule,start_date").eq("va_id",user.id).neq("placement_stage","ended").order("created_at",{ascending:false});
  if(error)throw error;
  const rooms=(roomData||[]) as VaSupportRoomRow[];
  const roomIds=rooms.map((r)=>r.id);const jobIds=rooms.map((r)=>r.job_id);
  const [{data:jobs},{data:requestData}]=await Promise.all([
    jobIds.length?admin.from("jobs").select("id,title,company_name,timezone").in("id",jobIds):Promise.resolve({data:[]}),
    roomIds.length?admin.from("placement_support_requests").select("*").in("workroom_id",roomIds).eq("requester_id",user.id).order("created_at",{ascending:false}).limit(100):Promise.resolve({data:[]})
  ]);
  const requests=(requestData||[]) as PlacementSupportRequestRow[];
  const jobMap=new Map(((jobs||[]) as JobSummaryRow[]).map((x)=>[x.id,x]));

  return <div className="va-support-page">
    {query.support_sent?<div className="success-banner" role="status"><CheckCircle2 size={16}/>Your update was sent to Client Success.</div>:null}
    <div className="page-head va-support-head"><div><div className="kicker">Active work</div><h1>Schedule & support</h1><p>Report leave, sickness, emergencies, delays, schedule changes, or placement concerns in one place.</p></div></div>
    <div className="info-banner va-support-guidance"><span className="va-support-guidance-icon" aria-hidden="true"><LifeBuoy size={17}/></span><div><strong>Tell the agency early.</strong><p>Client Success can coordinate with the client, reduce surprises, and help before a temporary issue affects the placement.</p></div></div>

    {rooms.length?<div className="stack va-support-placements">{rooms.map((room)=>{const job:Partial<JobSummaryRow>=jobMap.get(room.job_id)||{};const recent=requests.filter((r)=>r.workroom_id===room.id);return <section className="card stack va-support-placement-card" key={room.id}>
      <div className="row-between wrap"><div><h2 style={{margin:"0 0 4px"}}>{job.title||"Placement"}</h2><p className="small muted" style={{margin:0}}>{job.company_name||"Client"} · {room.agreed_schedule||job.timezone||"Schedule not recorded"}</p></div><span className="badge">{String(room.placement_stage).replaceAll("_"," ")}</span></div>
      <form action={submitPlacementSupportRequestAction} className="stack va-support-form"><input type="hidden" name="workroom_id" value={room.id}/><div className="form-grid"><div className="field"><label>Update type</label><select name="request_type" required defaultValue="leave"><option value="leave">Planned leave</option><option value="sick">Sick leave</option><option value="emergency">Emergency</option><option value="late">Late / delayed today</option><option value="schedule_change">Schedule change</option><option value="concern">Placement concern</option></select></div><div className="field"><label>Start date</label><input type="date" name="start_date" required/></div><div className="field"><label>End date <span className="muted">(optional)</span></label><input type="date" name="end_date"/></div><div className="field span-2"><label>Details</label><textarea name="details" required minLength={5} maxLength={4000} placeholder="Explain the timing, expected impact, and anything Client Success should coordinate with the client."/></div></div><div className="row-between wrap va-support-actions"><span className="small muted">Emergencies are marked urgent automatically.</span><button className="btn btn-primary" type="submit">Send update</button></div></form>
      {recent.length?<div className="va-support-recent"><h3>Your recent updates</h3><div className="stack">{recent.slice(0,8).map((request)=><div className="review-answer va-support-update" key={request.id}><div className="row-between wrap"><strong>{TYPE_LABELS[request.request_type]||String(request.request_type).replaceAll("_"," ")}</strong><span className={`badge ${badge(request.status)}`}>{STATUS_LABELS[request.status]||request.status}</span></div><p className="small" style={{margin:"7px 0"}}>{request.details}</p><div className="row wrap small muted"><span><CalendarClock size={12}/>{request.start_date||new Date(request.created_at).toLocaleDateString("en-PH")}{request.end_date?` to ${request.end_date}`:""}</span>{request.resolution?<span>Client Success: {request.resolution}</span>:null}</div></div>)}</div></div>:null}
    </section>})}</div>:<div className="card empty va-support-empty"><h3>No active placement yet.</h3><p>Schedule and placement support becomes available after your placement is confirmed.</p></div>}
  </div>;
}
